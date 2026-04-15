import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { emitDocumentUpdate } from "../lib/socket.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const documentRouter = Router();

const createDocSchema = z.object({
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1),
});

const uploadSchema = z.object({
  fileUrl: z.string().url(),
});

const validationSchema = z.object({
  valid: z.boolean(),
  validationResult: z.record(z.unknown()).optional(),
});

const deliverSchema = z.object({
  deliveredTo: z.array(z.string().uuid()),
});

// POST / - Create document order
documentRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createDocSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const doc = await prisma.document.create({
      data: {
        id: uuidv4(),
        ...parsed.data,
        status: "ordered",
        orderedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /:id/upload - Upload document
documentRouter.post("/:id/upload", async (req: Request, res: Response) => {
  try {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        status: "uploaded",
        fileUrl: parsed.data.fileUrl,
        uploadedAt: new Date(),
      },
    });

    emitDocumentUpdate(doc.hospitalId, "document:uploaded", {
      documentId: doc.id,
      type: doc.type,
      title: doc.title,
      status: "uploaded",
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /:id/validate - AI validation step
documentRouter.post("/:id/validate", async (req: Request, res: Response) => {
  try {
    const parsed = validationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    const newStatus = parsed.data.valid ? "validated" : "rejected";

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        validationResult: parsed.data.validationResult || { valid: parsed.data.valid },
        validatedAt: new Date(),
      },
    });

    emitDocumentUpdate(doc.hospitalId, "document:validated", {
      documentId: doc.id,
      status: newStatus,
      validationResult: updated.validationResult,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /:id/deliver - Deliver to recipients
documentRouter.post("/:id/deliver", async (req: Request, res: Response) => {
  try {
    const parsed = deliverSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        status: "delivered",
        deliveredTo: parsed.data.deliveredTo,
        deliveredAt: new Date(),
      },
    });

    emitDocumentUpdate(doc.hospitalId, "document:delivered", {
      documentId: doc.id,
      deliveredTo: parsed.data.deliveredTo,
      deliveredAt: updated.deliveredAt,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET / - List documents with filters
documentRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { patientId, hospitalId, type, status } = req.query;

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (hospitalId) where.hospitalId = hospitalId;
    if (type) where.type = type;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { orderedAt: "desc" },
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /pipeline/:hospitalId - Documents grouped by status (Kanban view)
documentRouter.get("/pipeline/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const documents = await prisma.document.findMany({
      where: { hospitalId },
      orderBy: { orderedAt: "desc" },
    });

    const pipeline: Record<string, typeof documents> = {
      ordered: [],
      uploaded: [],
      validating: [],
      validated: [],
      rejected: [],
      delivered: [],
    };

    for (const doc of documents) {
      const status = doc.status as string;
      if (pipeline[status]) {
        pipeline[status].push(doc);
      } else {
        pipeline[status] = [doc];
      }
    }

    res.json({ success: true, data: pipeline });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /:id - Single document
documentRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
