import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";

export const followUpRouter = Router();

const createFollowUpSchema = z.object({
  caseSheetId: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledDate: z.string(),
  soapNote: z.object({
    subjective: z.string().min(1),
    objective: z.string().min(1),
    assessment: z.string().min(1),
    plan: z.string().min(1),
  }),
  vitalChanges: z.object({
    bloodPressure: z.object({ previous: z.string(), current: z.string() }).optional(),
    heartRate: z.object({ previous: z.number(), current: z.number() }).optional(),
    temperature: z.object({ previous: z.number(), current: z.number() }).optional(),
    weight: z.object({ previous: z.number(), current: z.number() }).optional(),
  }).optional(),
  labChanges: z.array(
    z.object({
      testName: z.string(),
      previousValue: z.string(),
      currentValue: z.string(),
      unit: z.string().optional(),
      normalRange: z.string().optional(),
    })
  ).optional(),
  notes: z.string().optional(),
});

// GET /today - Get today's follow-ups for a doctor (must be before /:id)
followUpRouter.get("/today", async (req: Request, res: Response) => {
  try {
    const doctorId = req.query.doctorId as string;
    if (!doctorId) {
      res.status(400).json({ success: false, error: "doctorId query parameter is required" });
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const followUps = await prisma.follow_ups.findMany({
      where: {
        doctorId,
        scheduledDate: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: { scheduledDate: "asc" },
      include: { patient: true, case_sheet: true },
    });

    res.json({ success: true, data: followUps });
  } catch (error) {
    console.error("Error fetching today's follow-ups:", error);
    res.status(500).json({ success: false, error: "Failed to fetch today's follow-ups" });
  }
});

// POST / - Create follow-up
followUpRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createFollowUpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const id = uuidv4();
    const followUp = await prisma.follow_ups.create({
      data: {
        id,
        ...parsed.data,
        soapNote: parsed.data.soapNote as any,
        vitalChanges: parsed.data.vitalChanges as any,
        labChanges: parsed.data.labChanges as any,
        scheduledDate: new Date(parsed.data.scheduledDate),
        status: "scheduled",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: parsed.data.doctorId,
      action: "CREATE",
      resourceType: "follow_up",
      resourceId: id,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ success: true, data: followUp });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ success: false, error: "Failed to create follow-up" });
  }
});

// GET / - List follow-ups with filters
followUpRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.doctorId) where.doctorId = req.query.doctorId;
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.caseSheetId) where.caseSheetId = req.query.caseSheetId;
    if (req.query.status) where.status = req.query.status;

    if (req.query.dateFrom || req.query.dateTo) {
      where.scheduledDate = {};
      if (req.query.dateFrom) (where.scheduledDate as any).gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) (where.scheduledDate as any).lte = new Date(req.query.dateTo as string);
    }

    const [followUps, total] = await Promise.all([
      prisma.follow_ups.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { scheduledDate: "desc" },
        include: { patient: true },
      }),
      prisma.follow_ups.count({ where }),
    ]);

    res.json({
      success: true,
      data: followUps,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Error listing follow-ups:", error);
    res.status(500).json({ success: false, error: "Failed to list follow-ups" });
  }
});

// GET /:id - Get single follow-up
followUpRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const followUp = await prisma.follow_ups.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true, case_sheet: true },
    });

    if (!followUp) {
      res.status(404).json({ success: false, error: "Follow-up not found" });
      return;
    }

    res.json({ success: true, data: followUp });
  } catch (error) {
    console.error("Error fetching follow-up:", error);
    res.status(500).json({ success: false, error: "Failed to fetch follow-up" });
  }
});

// PATCH /:id/complete - Mark as completed
followUpRouter.patch("/:id/complete", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.follow_ups.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Follow-up not found" });
      return;
    }

    const followUp = await prisma.follow_ups.update({
      where: { id: req.params.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: (existing as any).doctorId,
      action: "COMPLETE",
      resourceType: "follow_up",
      resourceId: req.params.id,
      previousData: { status: (existing as any).status },
      newData: { status: "completed" },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: followUp });
  } catch (error) {
    console.error("Error completing follow-up:", error);
    res.status(500).json({ success: false, error: "Failed to complete follow-up" });
  }
});
