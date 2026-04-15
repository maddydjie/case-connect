import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";

export const caseSheetRouter = Router();

const createCaseSheetSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  departmentCode: z.string().min(1),
  chiefComplaints: z.array(z.string()).min(1),
  historyOfPresentIllness: z.string().min(1),
  generalExamination: z.object({
    vitals: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      respiratoryRate: z.number().optional(),
      oxygenSaturation: z.number().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
    }),
    appearance: z.string().optional(),
    consciousness: z.string().optional(),
  }),
  diagnosis: z.array(
    z.object({
      code: z.string(),
      description: z.string(),
      type: z.enum(["primary", "secondary", "differential"]).optional(),
    })
  ),
  treatmentPlan: z.object({
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      route: z.string().optional(),
    })).optional(),
    procedures: z.array(z.string()).optional(),
    investigations: z.array(z.string()).optional(),
    advice: z.string().optional(),
    followUpDate: z.string().optional(),
  }),
});

const updateCaseSheetSchema = createCaseSheetSchema.partial();

// POST / - Create case sheet
caseSheetRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createCaseSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const id = uuidv4();
    const caseSheet = await prisma.case_sheets.create({
      data: {
        id,
        ...parsed.data,
        chiefComplaints: parsed.data.chiefComplaints as any,
        generalExamination: parsed.data.generalExamination as any,
        diagnosis: parsed.data.diagnosis as any,
        treatmentPlan: parsed.data.treatmentPlan as any,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: parsed.data.doctorId,
      action: "CREATE",
      resourceType: "case_sheet",
      resourceId: id,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ success: true, data: caseSheet });
  } catch (error) {
    console.error("Error creating case sheet:", error);
    res.status(500).json({ success: false, error: "Failed to create case sheet" });
  }
});

// GET / - List case sheets with pagination
caseSheetRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.doctorId) where.doctorId = req.query.doctorId;
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.departmentCode) where.departmentCode = req.query.departmentCode;

    const [caseSheets, total] = await Promise.all([
      prisma.case_sheets.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.case_sheets.count({ where }),
    ]);

    res.json({
      success: true,
      data: caseSheets,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Error listing case sheets:", error);
    res.status(500).json({ success: false, error: "Failed to list case sheets" });
  }
});

// GET /:id - Get single case sheet
caseSheetRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const caseSheet = await prisma.case_sheets.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!caseSheet) {
      res.status(404).json({ success: false, error: "Case sheet not found" });
      return;
    }

    res.json({ success: true, data: caseSheet });
  } catch (error) {
    console.error("Error fetching case sheet:", error);
    res.status(500).json({ success: false, error: "Failed to fetch case sheet" });
  }
});

// PUT /:id - Update case sheet
caseSheetRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = updateCaseSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.case_sheets.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Case sheet not found" });
      return;
    }

    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.chiefComplaints) updateData.chiefComplaints = parsed.data.chiefComplaints as any;
    if (parsed.data.generalExamination) updateData.generalExamination = parsed.data.generalExamination as any;
    if (parsed.data.diagnosis) updateData.diagnosis = parsed.data.diagnosis as any;
    if (parsed.data.treatmentPlan) updateData.treatmentPlan = parsed.data.treatmentPlan as any;

    const caseSheet = await prisma.case_sheets.update({
      where: { id: req.params.id },
      data: updateData as any,
    });

    await createAuditLog({
      userId: parsed.data.doctorId || (existing as any).doctorId,
      action: "UPDATE",
      resourceType: "case_sheet",
      resourceId: req.params.id,
      previousData: existing as any,
      newData: parsed.data as any,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: caseSheet });
  } catch (error) {
    console.error("Error updating case sheet:", error);
    res.status(500).json({ success: false, error: "Failed to update case sheet" });
  }
});

// PATCH /:id/status - Update status only
caseSheetRouter.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const statusSchema = z.object({ status: z.string().min(1) });
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.case_sheets.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Case sheet not found" });
      return;
    }

    const caseSheet = await prisma.case_sheets.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status, updatedAt: new Date() },
    });

    await createAuditLog({
      userId: (existing as any).doctorId,
      action: "STATUS_UPDATE",
      resourceType: "case_sheet",
      resourceId: req.params.id,
      previousData: { status: (existing as any).status },
      newData: { status: parsed.data.status },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: caseSheet });
  } catch (error) {
    console.error("Error updating case sheet status:", error);
    res.status(500).json({ success: false, error: "Failed to update case sheet status" });
  }
});

// GET /:id/pdf - Generate PDF export (stub)
caseSheetRouter.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const caseSheet = await prisma.case_sheets.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!caseSheet) {
      res.status(404).json({ success: false, error: "Case sheet not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        message: "PDF generation stub - will be replaced with actual PDF generation",
        caseSheetId: caseSheet.id,
        format: "application/pdf",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: "Failed to generate PDF" });
  }
});
