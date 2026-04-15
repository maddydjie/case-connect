import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";

export const emergencyRouter = Router();

const createEmergencySchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  triageCategory: z.enum(["red", "orange", "yellow", "green", "blue"]),
  arrivalMode: z.enum(["ambulance", "walk-in", "referral", "police", "other"]),
  airway: z.object({
    status: z.string(),
    intervention: z.string().optional(),
    notes: z.string().optional(),
  }),
  breathing: z.object({
    status: z.string(),
    rate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    intervention: z.string().optional(),
    notes: z.string().optional(),
  }),
  circulation: z.object({
    status: z.string(),
    heartRate: z.number().optional(),
    bloodPressure: z.string().optional(),
    capillaryRefill: z.string().optional(),
    intervention: z.string().optional(),
    notes: z.string().optional(),
  }),
  vitals: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    gcsScore: z.number().optional(),
  }),
  chiefComplaint: z.string().min(1),
  initialAssessment: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
});

// POST / - Create emergency document
emergencyRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createEmergencySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const id = uuidv4();
    const now = new Date();

    const emergency = await prisma.emergency_docs.create({
      data: {
        id,
        ...parsed.data,
        airway: parsed.data.airway as any,
        breathing: parsed.data.breathing as any,
        circulation: parsed.data.circulation as any,
        vitals: parsed.data.vitals as any,
        allergies: parsed.data.allergies as any,
        currentMedications: parsed.data.currentMedications as any,
        status: "active",
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    await createAuditLog({
      userId: parsed.data.doctorId,
      action: "CREATE",
      resourceType: "emergency_doc",
      resourceId: id,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ success: true, data: emergency });
  } catch (error) {
    console.error("Error creating emergency doc:", error);
    res.status(500).json({ success: false, error: "Failed to create emergency document" });
  }
});

// GET / - List emergencies with filters
emergencyRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.doctorId) where.doctorId = req.query.doctorId;
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.triageCategory) where.triageCategory = req.query.triageCategory;
    if (req.query.status) where.status = req.query.status;

    if (req.query.dateFrom || req.query.dateTo) {
      where.startedAt = {};
      if (req.query.dateFrom) (where.startedAt as any).gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) (where.startedAt as any).lte = new Date(req.query.dateTo as string);
    }

    const [emergencies, total] = await Promise.all([
      prisma.emergency_docs.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startedAt: "desc" },
      }),
      prisma.emergency_docs.count({ where }),
    ]);

    res.json({
      success: true,
      data: emergencies,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Error listing emergencies:", error);
    res.status(500).json({ success: false, error: "Failed to list emergencies" });
  }
});

// GET /:id - Get single emergency
emergencyRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const emergency = await prisma.emergency_docs.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!emergency) {
      res.status(404).json({ success: false, error: "Emergency document not found" });
      return;
    }

    res.json({ success: true, data: emergency });
  } catch (error) {
    console.error("Error fetching emergency doc:", error);
    res.status(500).json({ success: false, error: "Failed to fetch emergency document" });
  }
});

// PATCH /:id/complete - Complete emergency document
emergencyRouter.patch("/:id/complete", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.emergency_docs.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Emergency document not found" });
      return;
    }

    if ((existing as any).completedAt) {
      res.status(400).json({ success: false, error: "Emergency document already completed" });
      return;
    }

    const completedAt = new Date();
    const startedAt = new Date((existing as any).startedAt);
    const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

    const emergency = await prisma.emergency_docs.update({
      where: { id: req.params.id },
      data: {
        status: "completed",
        completedAt,
        durationSeconds,
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: (existing as any).doctorId,
      action: "COMPLETE",
      resourceType: "emergency_doc",
      resourceId: req.params.id,
      previousData: { status: (existing as any).status },
      newData: { status: "completed", completedAt: completedAt.toISOString(), durationSeconds },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: emergency });
  } catch (error) {
    console.error("Error completing emergency doc:", error);
    res.status(500).json({ success: false, error: "Failed to complete emergency document" });
  }
});

// POST /:id/escalate - Escalate to senior
emergencyRouter.post("/:id/escalate", async (req: Request, res: Response) => {
  try {
    const escalateSchema = z.object({
      escalatedTo: z.string().uuid(),
      reason: z.string().min(1),
    });

    const parsed = escalateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.emergency_docs.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Emergency document not found" });
      return;
    }

    const emergency = await prisma.emergency_docs.update({
      where: { id: req.params.id },
      data: {
        escalatedTo: parsed.data.escalatedTo,
        escalationReason: parsed.data.reason,
        escalatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: (existing as any).doctorId,
      action: "ESCALATE",
      resourceType: "emergency_doc",
      resourceId: req.params.id,
      previousData: { escalatedTo: null },
      newData: { escalatedTo: parsed.data.escalatedTo, reason: parsed.data.reason },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: emergency });
  } catch (error) {
    console.error("Error escalating emergency doc:", error);
    res.status(500).json({ success: false, error: "Failed to escalate emergency document" });
  }
});
