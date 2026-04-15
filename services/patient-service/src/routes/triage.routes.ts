import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { assessTriage } from "../lib/triage-engine";

const router = Router();

const triageAssessmentSchema = z.object({
  symptoms: z.array(z.string()).min(1),
  duration: z.string().min(1),
  severity: z.number().min(1).max(10),
  age: z.number().min(0).max(150),
  gender: z.string().min(1),
  preExistingConditions: z.array(z.string()).default([]),
  patientId: z.string().uuid().optional(),
});

// POST /assess - Submit symptoms for triage assessment
router.post("/assess", async (req: Request, res: Response) => {
  try {
    const data = triageAssessmentSchema.parse(req.body);

    const result = assessTriage({
      symptoms: data.symptoms,
      duration: data.duration,
      severity: data.severity,
      age: data.age,
      gender: data.gender,
      preExistingConditions: data.preExistingConditions,
    });

    if (data.patientId) {
      await prisma.triageAssessment.create({
        data: {
          id: uuidv4(),
          patientId: data.patientId,
          symptoms: data.symptoms,
          duration: data.duration,
          severity: data.severity,
          age: data.age,
          gender: data.gender,
          preExistingConditions: data.preExistingConditions,
          urgencyScore: result.urgencyScore,
          urgencyLevel: result.urgencyLevel,
          possibleConditions: result.possibleConditions,
          recommendedAction: result.recommendedAction,
          preConsultationSummary: result.preConsultationSummary,
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to assess triage";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /history/:patientId - Get triage history
router.get("/history/:patientId", async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.triageAssessment.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: assessments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get triage history";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
