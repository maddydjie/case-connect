import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";

const router = Router();

const registerPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date" }),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
});

const updatePatientSchema = registerPatientSchema.partial();

// POST / - Register patient
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = registerPatientSchema.parse(req.body);

    const patient = await prisma.patient.create({
      data: {
        id: uuidv4(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        chronicConditions: data.chronicConditions,
      },
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to register patient";
    res.status(500).json({ success: false, error: message });
  }
});

// GET / - List patients with search
router.get("/", async (req: Request, res: Response) => {
  try {
    const { query, hospitalId } = req.query;

    const where: Record<string, unknown> = {};

    if (query && typeof query === "string") {
      where.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ];
    }

    if (hospitalId && typeof hospitalId === "string") {
      where.hospitalId = hospitalId;
    }

    const patients = await prisma.patient.findMany({ where });

    res.json({ success: true, data: patients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list patients";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:id - Get patient with profile
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get patient";
    res.status(500).json({ success: false, error: message });
  }
});

// PUT /:id - Update patient profile
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const data = updatePatientSchema.parse(req.body);

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    res.json({ success: true, data: patient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to update patient";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /:id/family - Link family member
router.post("/:id/family", async (req: Request, res: Response) => {
  try {
    const { familyMemberId } = req.body;

    if (!familyMemberId) {
      res.status(400).json({ success: false, error: "familyMemberId is required" });
      return;
    }

    const [patient, familyMember] = await Promise.all([
      prisma.patient.findUnique({ where: { id: req.params.id } }),
      prisma.patient.findUnique({ where: { id: familyMemberId } }),
    ]);

    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }
    if (!familyMember) {
      res.status(404).json({ success: false, error: "Family member not found" });
      return;
    }

    const link = await prisma.familyLink.create({
      data: {
        id: uuidv4(),
        patientId: req.params.id,
        familyMemberId,
      },
    });

    res.status(201).json({ success: true, data: link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to link family member";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:id/family - Get family members
router.get("/:id/family", async (req: Request, res: Response) => {
  try {
    const links = await prisma.familyLink.findMany({
      where: { patientId: req.params.id },
      include: { familyMember: true },
    });

    const familyMembers = links.map((link) => link.familyMember);

    res.json({ success: true, data: familyMembers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get family members";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
