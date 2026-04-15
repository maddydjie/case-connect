import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { filterCases, getAnonymizedCase, getDepartments } from "../lib/case-bank";

export const learningRouter = Router();

// GET /progress/:studentId - Get student progress
learningRouter.get("/progress/:studentId", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      res.json({
        success: true,
        data: {
          studentId,
          totalCases: 0,
          correctDiagnoses: 0,
          accuracy: 0,
          totalScore: 0,
          streak: 0,
          longestStreak: 0,
          rank: null,
          departmentPerformance: [],
          weakAreas: [],
          strongAreas: [],
        },
      });
      return;
    }

    const accuracy =
      stats.totalCasesPracticed > 0
        ? Math.round((stats.correctDiagnoses / stats.totalCasesPracticed) * 100 * 10) / 10
        : 0;

    const departmentPerf = await prisma.departmentStats.findMany({
      where: { studentId },
      orderBy: { totalCases: "desc" },
    });

    const deptPerformance = departmentPerf.map((d) => ({
      department: d.department,
      totalCases: d.totalCases,
      correctCases: d.correctCases,
      accuracy:
        d.totalCases > 0
          ? Math.round((d.correctCases / d.totalCases) * 100 * 10) / 10
          : 0,
    }));

    const weakAreas = deptPerformance
      .filter((d) => d.totalCases >= 3 && d.accuracy < 60)
      .map((d) => d.department);

    const strongAreas = deptPerformance
      .filter((d) => d.totalCases >= 3 && d.accuracy >= 80)
      .map((d) => d.department);

    const allStudents = await prisma.studentStats.findMany({
      orderBy: { totalScore: "desc" },
      select: { studentId: true },
    });
    const rank = allStudents.findIndex((s) => s.studentId === studentId) + 1;

    res.json({
      success: true,
      data: {
        studentId,
        totalCases: stats.totalCasesPracticed,
        correctDiagnoses: stats.correctDiagnoses,
        accuracy,
        totalScore: stats.totalScore,
        streak: stats.streak,
        longestStreak: stats.longestStreak,
        rank: rank > 0 ? rank : null,
        departmentPerformance: deptPerformance,
        weakAreas,
        strongAreas,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch progress",
    });
  }
});

// GET /weak-areas/:studentId - Identify weak areas
learningRouter.get("/weak-areas/:studentId", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const departmentPerf = await prisma.departmentStats.findMany({
      where: { studentId },
    });

    if (departmentPerf.length === 0) {
      res.json({
        success: true,
        data: {
          studentId,
          weakAreas: [],
          message: "No cases attempted yet. Start practicing to identify areas for improvement.",
        },
      });
      return;
    }

    const recentResults = await prisma.casePracticeResult.findMany({
      where: { studentId, isCorrect: false },
      orderBy: { attemptedAt: "desc" },
      take: 50,
    });

    const incorrectByDept: Record<string, { count: number; cases: string[] }> = {};
    for (const result of recentResults) {
      if (!incorrectByDept[result.department]) {
        incorrectByDept[result.department] = { count: 0, cases: [] };
      }
      incorrectByDept[result.department].count++;
      if (!incorrectByDept[result.department].cases.includes(result.correctDiagnosis)) {
        incorrectByDept[result.department].cases.push(result.correctDiagnosis);
      }
    }

    const weakAreas = departmentPerf
      .map((d) => {
        const accuracy =
          d.totalCases > 0
            ? Math.round((d.correctCases / d.totalCases) * 100 * 10) / 10
            : 0;
        return {
          department: d.department,
          totalCases: d.totalCases,
          correctCases: d.correctCases,
          accuracy,
          incorrectCount: incorrectByDept[d.department]?.count || 0,
          missedDiagnoses: incorrectByDept[d.department]?.cases || [],
        };
      })
      .filter((d) => d.accuracy < 70 || d.incorrectCount >= 2)
      .sort((a, b) => a.accuracy - b.accuracy);

    const allDepartments = getDepartments();
    const attemptedDepts = new Set(departmentPerf.map((d) => d.department));
    const unattemptedDepts = allDepartments.filter((d) => !attemptedDepts.has(d));

    res.json({
      success: true,
      data: {
        studentId,
        weakAreas,
        unattemptedDepartments: unattemptedDepts,
        totalIncorrect: recentResults.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch weak areas",
    });
  }
});

// GET /recommendations/:studentId - Recommend cases based on weak areas
learningRouter.get("/recommendations/:studentId", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const departmentPerf = await prisma.departmentStats.findMany({
      where: { studentId },
    });

    const attemptedResults = await prisma.casePracticeResult.findMany({
      where: { studentId },
      select: { caseId: true, isCorrect: true },
    });

    const attemptedCaseIds = new Set(attemptedResults.map((r) => r.caseId));
    const incorrectCaseIds = new Set(
      attemptedResults.filter((r) => !r.isCorrect).map((r) => r.caseId)
    );

    const deptAccuracy: Record<string, number> = {};
    for (const d of departmentPerf) {
      deptAccuracy[d.department] =
        d.totalCases > 0 ? d.correctCases / d.totalCases : 0;
    }

    const allDepartments = getDepartments();
    const attemptedDepts = new Set(departmentPerf.map((d) => d.department));

    const recommendations: Array<{
      category: string;
      reason: string;
      cases: ReturnType<typeof getAnonymizedCase>[];
    }> = [];

    // 1. Retry incorrect cases
    const incorrectCases = filterCases().filter((c) => incorrectCaseIds.has(c.id));
    if (incorrectCases.length > 0) {
      recommendations.push({
        category: "Retry Previously Incorrect",
        reason: "Revisit cases you got wrong to reinforce learning",
        cases: incorrectCases.slice(0, 5).map(getAnonymizedCase),
      });
    }

    // 2. Weak department cases
    const weakDepts = Object.entries(deptAccuracy)
      .filter(([, acc]) => acc < 0.7)
      .sort(([, a], [, b]) => a - b)
      .map(([dept]) => dept);

    for (const dept of weakDepts.slice(0, 3)) {
      const deptCases = filterCases(dept).filter((c) => !attemptedCaseIds.has(c.id));
      if (deptCases.length > 0) {
        recommendations.push({
          category: `Strengthen ${dept}`,
          reason: `Your accuracy in ${dept} is below 70% — practice more cases here`,
          cases: deptCases.slice(0, 3).map(getAnonymizedCase),
        });
      }
    }

    // 3. Unattempted departments
    for (const dept of allDepartments.filter((d) => !attemptedDepts.has(d))) {
      const deptCases = filterCases(dept);
      if (deptCases.length > 0) {
        recommendations.push({
          category: `Explore ${dept}`,
          reason: `You haven't tried any ${dept} cases yet`,
          cases: deptCases.slice(0, 2).map(getAnonymizedCase),
        });
      }
    }

    // 4. Challenge with harder cases if student is strong
    const overallStats = await prisma.studentStats.findUnique({
      where: { studentId },
    });
    if (
      overallStats &&
      overallStats.totalCasesPracticed >= 10 &&
      overallStats.correctDiagnoses / overallStats.totalCasesPracticed >= 0.8
    ) {
      const hardCases = filterCases(undefined, "hard").filter(
        (c) => !attemptedCaseIds.has(c.id)
      );
      if (hardCases.length > 0) {
        recommendations.push({
          category: "Challenge Yourself",
          reason: "Your accuracy is strong — try harder cases to push your limits",
          cases: hardCases.slice(0, 3).map(getAnonymizedCase),
        });
      }
    }

    res.json({
      success: true,
      data: {
        studentId,
        recommendations,
        totalRecommendations: recommendations.reduce(
          (sum, r) => sum + r.cases.length,
          0
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate recommendations",
    });
  }
});

const feedbackSchema = z.object({
  studentId: z.string().uuid(),
  facultyId: z.string().uuid(),
  caseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comments: z.string().min(1),
});

// POST /feedback - Faculty feedback
learningRouter.post("/feedback", async (req: Request, res: Response) => {
  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { studentId, facultyId, caseId, rating, comments } = parsed.data;

    const feedback = await prisma.facultyFeedback.create({
      data: {
        id: uuidv4(),
        studentId,
        facultyId,
        caseId,
        rating,
        comments,
        createdAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to save feedback",
    });
  }
});
