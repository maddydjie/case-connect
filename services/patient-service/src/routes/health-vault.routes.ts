import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";

const router = Router();

const addRecordSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date" }),
  hospitalName: z.string().optional(),
  doctorName: z.string().optional(),
  fileUrl: z.string().url().optional(),
  data: z.record(z.unknown()).optional(),
});

const shareRecordsSchema = z.object({
  doctorId: z.string().uuid(),
  recordIds: z.array(z.string().uuid()).min(1),
});

const linkAbhaSchema = z.object({
  abhaId: z.string().min(1),
});

// GET /:patientId - Get all health records for patient
router.get("/:patientId", async (req: Request, res: Response) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { date: "desc" },
    });

    res.json({ success: true, data: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get health records";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /:patientId/records - Add a health record
router.post("/:patientId/records", async (req: Request, res: Response) => {
  try {
    const data = addRecordSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({
      where: { id: req.params.patientId },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }

    const record = await prisma.healthRecord.create({
      data: {
        id: uuidv4(),
        patientId: req.params.patientId,
        type: data.type,
        title: data.title,
        date: new Date(data.date),
        hospitalName: data.hospitalName,
        doctorName: data.doctorName,
        fileUrl: data.fileUrl,
        data: data.data ?? {},
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to add health record";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:patientId/records/:recordId - Get single record
router.get("/:patientId/records/:recordId", async (req: Request, res: Response) => {
  try {
    const record = await prisma.healthRecord.findFirst({
      where: {
        id: req.params.recordId,
        patientId: req.params.patientId,
      },
    });

    if (!record) {
      res.status(404).json({ success: false, error: "Health record not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get health record";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /:patientId/share - Share records with doctor
router.post("/:patientId/share", async (req: Request, res: Response) => {
  try {
    const data = shareRecordsSchema.parse(req.body);

    const shares = await Promise.all(
      data.recordIds.map((recordId) =>
        prisma.recordShare.upsert({
          where: {
            recordId_doctorId: {
              recordId,
              doctorId: data.doctorId,
            },
          },
          update: {},
          create: {
            id: uuidv4(),
            patientId: req.params.patientId,
            recordId,
            doctorId: data.doctorId,
          },
        })
      )
    );

    res.status(201).json({ success: true, data: shares });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to share records";
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /:patientId/share/:doctorId - Revoke sharing
router.delete("/:patientId/share/:doctorId", async (req: Request, res: Response) => {
  try {
    await prisma.recordShare.deleteMany({
      where: {
        patientId: req.params.patientId,
        doctorId: req.params.doctorId,
      },
    });

    res.json({ success: true, data: { message: "Sharing revoked" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke sharing";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:patientId/shared - Get list of doctors records are shared with
router.get("/:patientId/shared", async (req: Request, res: Response) => {
  try {
    const shares = await prisma.recordShare.findMany({
      where: { patientId: req.params.patientId },
      select: {
        doctorId: true,
        recordId: true,
        createdAt: true,
      },
    });

    const grouped = shares.reduce<Record<string, { doctorId: string; recordIds: string[]; sharedAt: Date }>>((acc, s) => {
      if (!acc[s.doctorId]) {
        acc[s.doctorId] = { doctorId: s.doctorId, recordIds: [], sharedAt: s.createdAt };
      }
      acc[s.doctorId].recordIds.push(s.recordId);
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get shared records";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /:patientId/abdm/link - Link ABHA ID
router.post("/:patientId/abdm/link", async (req: Request, res: Response) => {
  try {
    const data = linkAbhaSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({
      where: { id: req.params.patientId },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }

    const abdmLink = await prisma.abdmLink.upsert({
      where: { patientId: req.params.patientId },
      update: {
        abhaId: data.abhaId,
        status: "linked",
        linkedAt: new Date(),
      },
      create: {
        id: uuidv4(),
        patientId: req.params.patientId,
        abhaId: data.abhaId,
        status: "linked",
        linkedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: abdmLink });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to link ABHA ID";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:patientId/abdm/status - Get ABDM linking status
router.get("/:patientId/abdm/status", async (req: Request, res: Response) => {
  try {
    const abdmLink = await prisma.abdmLink.findUnique({
      where: { patientId: req.params.patientId },
    });

    if (!abdmLink) {
      res.json({
        success: true,
        data: { linked: false, status: "not_linked", abhaId: null },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        linked: abdmLink.status === "linked",
        status: abdmLink.status,
        abhaId: abdmLink.abhaId,
        linkedAt: abdmLink.linkedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get ABDM status";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
