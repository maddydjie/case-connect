import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";

export const opSheetRouter = Router();

const createOpSheetSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  departmentCode: z.string().min(1),
  chiefComplaints: z.array(z.string()).min(1),
  examination: z.object({
    general: z.string().optional(),
    systemic: z.string().optional(),
    localExamination: z.string().optional(),
    vitals: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      respiratoryRate: z.number().optional(),
      oxygenSaturation: z.number().optional(),
    }).optional(),
  }),
  diagnosis: z.array(
    z.object({
      code: z.string(),
      description: z.string(),
      type: z.enum(["primary", "secondary", "differential"]).optional(),
    })
  ),
  prescription: z.object({
    medications: z.array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        route: z.string().optional(),
        instructions: z.string().optional(),
      })
    ),
  }),
  icdCodes: z.array(z.string()),
  advice: z.string().optional(),
  followUpDate: z.string().optional(),
});

const updateOpSheetSchema = createOpSheetSchema.partial();

// POST / - Create OP sheet
opSheetRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createOpSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const id = uuidv4();
    const opSheet = await prisma.op_sheets.create({
      data: {
        id,
        ...parsed.data,
        chiefComplaints: parsed.data.chiefComplaints as any,
        examination: parsed.data.examination as any,
        diagnosis: parsed.data.diagnosis as any,
        prescription: parsed.data.prescription as any,
        icdCodes: parsed.data.icdCodes as any,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: parsed.data.doctorId,
      action: "CREATE",
      resourceType: "op_sheet",
      resourceId: id,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ success: true, data: opSheet });
  } catch (error) {
    console.error("Error creating OP sheet:", error);
    res.status(500).json({ success: false, error: "Failed to create OP sheet" });
  }
});

// GET / - List OP sheets with pagination
opSheetRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.doctorId) where.doctorId = req.query.doctorId;
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.departmentCode) where.departmentCode = req.query.departmentCode;

    const [opSheets, total] = await Promise.all([
      prisma.op_sheets.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.op_sheets.count({ where }),
    ]);

    res.json({
      success: true,
      data: opSheets,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Error listing OP sheets:", error);
    res.status(500).json({ success: false, error: "Failed to list OP sheets" });
  }
});

// GET /:id - Get single OP sheet
opSheetRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const opSheet = await prisma.op_sheets.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!opSheet) {
      res.status(404).json({ success: false, error: "OP sheet not found" });
      return;
    }

    res.json({ success: true, data: opSheet });
  } catch (error) {
    console.error("Error fetching OP sheet:", error);
    res.status(500).json({ success: false, error: "Failed to fetch OP sheet" });
  }
});

// PUT /:id - Update OP sheet
opSheetRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = updateOpSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.op_sheets.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "OP sheet not found" });
      return;
    }

    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.chiefComplaints) updateData.chiefComplaints = parsed.data.chiefComplaints as any;
    if (parsed.data.examination) updateData.examination = parsed.data.examination as any;
    if (parsed.data.diagnosis) updateData.diagnosis = parsed.data.diagnosis as any;
    if (parsed.data.prescription) updateData.prescription = parsed.data.prescription as any;
    if (parsed.data.icdCodes) updateData.icdCodes = parsed.data.icdCodes as any;

    const opSheet = await prisma.op_sheets.update({
      where: { id: req.params.id },
      data: updateData as any,
    });

    await createAuditLog({
      userId: parsed.data.doctorId || (existing as any).doctorId,
      action: "UPDATE",
      resourceType: "op_sheet",
      resourceId: req.params.id,
      previousData: existing as any,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: opSheet });
  } catch (error) {
    console.error("Error updating OP sheet:", error);
    res.status(500).json({ success: false, error: "Failed to update OP sheet" });
  }
});

// POST /:id/export - Export as PDF (stub)
opSheetRouter.post("/:id/export", async (req: Request, res: Response) => {
  try {
    const opSheet = await prisma.op_sheets.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!opSheet) {
      res.status(404).json({ success: false, error: "OP sheet not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        message: "PDF export stub - will be replaced with actual PDF generation",
        opSheetId: opSheet.id,
        format: "application/pdf",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error exporting OP sheet:", error);
    res.status(500).json({ success: false, error: "Failed to export OP sheet" });
  }
});
