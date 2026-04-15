import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import {
  filterCases,
  getCaseById,
  getAnonymizedCase,
  getDepartments,
} from "../lib/case-bank";

export const caseTutorRouter = Router();

// GET /cases - Get practice cases with filters
caseTutorRouter.get("/cases", async (req: Request, res: Response) => {
  try {
    const { department, difficulty } = req.query;

    const validDifficulties = ["easy", "medium", "hard"] as const;
    const diff =
      typeof difficulty === "string" &&
      validDifficulties.includes(difficulty as any)
        ? (difficulty as "easy" | "medium" | "hard")
        : undefined;

    const cases = filterCases(
      typeof department === "string" ? department : undefined,
      diff
    );

    const anonymized = cases.map(getAnonymizedCase);

    res.json({
      success: true,
      data: {
        cases: anonymized,
        total: anonymized.length,
        departments: getDepartments(),
        filters: { department: department || null, difficulty: difficulty || null },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch cases",
    });
  }
});

// GET /cases/:id - Get a specific practice case (without diagnosis)
caseTutorRouter.get("/cases/:id", async (req: Request, res: Response) => {
  try {
    const medCase = getCaseById(req.params.id);
    if (!medCase) {
      res.status(404).json({ success: false, error: "Case not found" });
      return;
    }

    res.json({
      success: true,
      data: getAnonymizedCase(medCase),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch case",
    });
  }
});

const attemptSchema = z.object({
  studentId: z.string().uuid(),
  attemptedDiagnosis: z.string().min(1),
  reasoning: z.string().min(1),
  timeSpentMs: z.number().int().positive().optional(),
});

// POST /cases/:id/attempt - Submit diagnosis attempt
caseTutorRouter.post("/cases/:id/attempt", async (req: Request, res: Response) => {
  try {
    const medCase = getCaseById(req.params.id);
    if (!medCase) {
      res.status(404).json({ success: false, error: "Case not found" });
      return;
    }

    const parsed = attemptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { studentId, attemptedDiagnosis, reasoning, timeSpentMs } = parsed.data;

    const isCorrect = normalizeDiagnosis(attemptedDiagnosis) === normalizeDiagnosis(medCase.correctDiagnosis);

    const similarityScore = calculateSimilarity(
      attemptedDiagnosis.toLowerCase(),
      medCase.correctDiagnosis.toLowerCase()
    );
    const isPartialMatch = !isCorrect && similarityScore > 0.5;

    let score: number;
    if (isCorrect) {
      score = medCase.difficulty === "hard" ? 30 : medCase.difficulty === "medium" ? 20 : 10;
    } else if (isPartialMatch) {
      score = medCase.difficulty === "hard" ? 10 : medCase.difficulty === "medium" ? 7 : 5;
    } else {
      score = 0;
    }

    const result = await prisma.casePracticeResult.create({
      data: {
        id: uuidv4(),
        studentId,
        caseId: req.params.id,
        attemptedDiagnosis,
        correctDiagnosis: medCase.correctDiagnosis,
        isCorrect,
        score,
        reasoning,
        department: medCase.department,
        difficulty: medCase.difficulty,
        timeSpentMs: timeSpentMs || null,
        attemptedAt: new Date(),
      },
    });

    const studentStats = await prisma.studentStats.upsert({
      where: { studentId },
      create: {
        id: uuidv4(),
        studentId,
        totalCasesPracticed: 1,
        correctDiagnoses: isCorrect ? 1 : 0,
        totalScore: score,
        streak: isCorrect ? 1 : 0,
        longestStreak: isCorrect ? 1 : 0,
        fastestCorrectMs: isCorrect && timeSpentMs ? timeSpentMs : null,
      },
      update: {
        totalCasesPracticed: { increment: 1 },
        correctDiagnoses: { increment: isCorrect ? 1 : 0 },
        totalScore: { increment: score },
        streak: isCorrect ? { increment: 1 } : 0,
        longestStreak: isCorrect
          ? {
              increment: 0, // handled below
            }
          : undefined,
        fastestCorrectMs:
          isCorrect && timeSpentMs ? timeSpentMs : undefined,
      },
    });

    if (isCorrect && studentStats.streak > (studentStats.longestStreak || 0)) {
      await prisma.studentStats.update({
        where: { studentId },
        data: { longestStreak: studentStats.streak },
      });
    }

    if (isCorrect && timeSpentMs && studentStats.fastestCorrectMs) {
      if (timeSpentMs < studentStats.fastestCorrectMs) {
        await prisma.studentStats.update({
          where: { studentId },
          data: { fastestCorrectMs: timeSpentMs },
        });
      }
    }

    await prisma.departmentStats.upsert({
      where: {
        studentId_department: { studentId, department: medCase.department },
      },
      create: {
        id: uuidv4(),
        studentId,
        department: medCase.department,
        totalCases: 1,
        correctCases: isCorrect ? 1 : 0,
      },
      update: {
        totalCases: { increment: 1 },
        correctCases: { increment: isCorrect ? 1 : 0 },
      },
    });

    const feedback = buildFeedback(
      isCorrect,
      isPartialMatch,
      attemptedDiagnosis,
      medCase.correctDiagnosis,
      medCase.keyFindings,
      medCase.differentialDiagnoses,
      medCase.explanation
    );

    res.json({
      success: true,
      data: {
        resultId: result.id,
        isCorrect,
        isPartialMatch,
        score,
        correctDiagnosis: medCase.correctDiagnosis,
        feedback,
        stats: {
          totalCasesPracticed: studentStats.totalCasesPracticed,
          correctDiagnoses: studentStats.correctDiagnoses,
          streak: isCorrect ? studentStats.streak : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to process attempt",
    });
  }
});

// GET /cases/:id/explanation - Get detailed explanation for a case
caseTutorRouter.get("/cases/:id/explanation", async (req: Request, res: Response) => {
  try {
    const medCase = getCaseById(req.params.id);
    if (!medCase) {
      res.status(404).json({ success: false, error: "Case not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        caseId: medCase.id,
        title: medCase.title,
        correctDiagnosis: medCase.correctDiagnosis,
        icdCode: medCase.icdCode,
        explanation: medCase.explanation,
        keyFindings: medCase.keyFindings,
        differentialDiagnoses: medCase.differentialDiagnoses,
        reasoningPathway: {
          step1_presentation: `The patient presents with: ${medCase.presentation.chiefComplaint}`,
          step2_key_symptoms: medCase.presentation.symptoms,
          step3_critical_findings: medCase.keyFindings,
          step4_differential: medCase.differentialDiagnoses.map((d, i) => ({
            rank: i + 1,
            diagnosis: d,
            whyLessLikely: `Consider but less likely given the specific presentation findings`,
          })),
          step5_final_diagnosis: medCase.correctDiagnosis,
          step6_explanation: medCase.explanation,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch explanation",
    });
  }
});

function normalizeDiagnosis(diagnosis: string): string {
  return diagnosis
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function buildFeedback(
  isCorrect: boolean,
  isPartialMatch: boolean,
  attempted: string,
  correct: string,
  keyFindings: string[],
  differentials: string[],
  explanation: string
): {
  verdict: string;
  message: string;
  whyThisDiagnosis: string;
  keyFindings: string[];
  differentialDiagnoses: string[];
  learningPoints: string[];
} {
  if (isCorrect) {
    return {
      verdict: "Correct!",
      message: `Excellent work! "${correct}" is the correct diagnosis.`,
      whyThisDiagnosis: explanation,
      keyFindings,
      differentialDiagnoses: differentials,
      learningPoints: [
        "You correctly identified the key findings",
        "Consider how this presentation differs from the differential diagnoses",
        "Review the key findings to reinforce your clinical reasoning",
      ],
    };
  }

  if (isPartialMatch) {
    return {
      verdict: "Partially Correct",
      message: `Close! You answered "${attempted}", but the correct diagnosis is "${correct}". Your answer was in the right direction.`,
      whyThisDiagnosis: explanation,
      keyFindings,
      differentialDiagnoses: differentials,
      learningPoints: [
        `Your answer "${attempted}" shares features with the correct diagnosis`,
        "Review the distinguishing features between these conditions",
        "Pay attention to the key findings that differentiate similar diagnoses",
      ],
    };
  }

  return {
    verdict: "Incorrect",
    message: `The correct diagnosis is "${correct}". You answered "${attempted}".`,
    whyThisDiagnosis: explanation,
    keyFindings,
    differentialDiagnoses: differentials,
    learningPoints: [
      "Review the key findings that point to the correct diagnosis",
      `Consider why "${attempted}" doesn't fit all the presented findings`,
      "Focus on pathognomonic signs that distinguish this condition",
    ],
  };
}
