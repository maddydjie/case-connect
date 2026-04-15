import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import {
  checkBadges,
  getAllBadges,
  BADGE_DEFINITIONS,
  type StudentStats,
} from "../lib/badge-engine";

export const leaderboardRouter = Router();

// GET / - Get leaderboard
leaderboardRouter.get("/", async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || "alltime";
    const department = req.query.department as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let dateFilter: Date | undefined;
    const now = new Date();
    if (timeframe === "weekly") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "monthly") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (dateFilter || department) {
      const whereClause: Record<string, any> = {};
      if (dateFilter) whereClause.attemptedAt = { gte: dateFilter };
      if (department) whereClause.department = department;

      const results = await prisma.casePracticeResult.groupBy({
        by: ["studentId"],
        where: whereClause,
        _count: { id: true },
        _sum: { score: true },
      });

      const correctCounts = await prisma.casePracticeResult.groupBy({
        by: ["studentId"],
        where: { ...whereClause, isCorrect: true },
        _count: { id: true },
      });

      const correctMap = new Map(
        correctCounts.map((c) => [c.studentId, c._count.id])
      );

      const badgeCounts = await prisma.studentBadge.groupBy({
        by: ["studentId"],
        _count: { id: true },
      });
      const badgeMap = new Map(
        badgeCounts.map((b) => [b.studentId, b._count.id])
      );

      const leaderboard = results
        .map((r) => {
          const total = r._count.id;
          const correct = correctMap.get(r.studentId) || 0;
          return {
            studentId: r.studentId,
            score: r._sum.score || 0,
            casesCompleted: total,
            correctDiagnoses: correct,
            accuracy: total > 0 ? Math.round((correct / total) * 100 * 10) / 10 : 0,
            badges: badgeMap.get(r.studentId) || 0,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry, idx) => ({ rank: idx + 1, ...entry }));

      res.json({
        success: true,
        data: {
          timeframe,
          department: department || "all",
          leaderboard,
          totalParticipants: results.length,
        },
      });
      return;
    }

    const allStats = await prisma.studentStats.findMany({
      orderBy: { totalScore: "desc" },
      take: limit,
    });

    const badgeCounts = await prisma.studentBadge.groupBy({
      by: ["studentId"],
      _count: { id: true },
    });
    const badgeMap = new Map(
      badgeCounts.map((b) => [b.studentId, b._count.id])
    );

    const leaderboard = allStats.map((s, idx) => ({
      rank: idx + 1,
      studentId: s.studentId,
      score: s.totalScore,
      casesCompleted: s.totalCasesPracticed,
      correctDiagnoses: s.correctDiagnoses,
      accuracy:
        s.totalCasesPracticed > 0
          ? Math.round(
              (s.correctDiagnoses / s.totalCasesPracticed) * 100 * 10
            ) / 10
          : 0,
      streak: s.streak,
      longestStreak: s.longestStreak,
      badges: badgeMap.get(s.studentId) || 0,
    }));

    res.json({
      success: true,
      data: {
        timeframe: "alltime",
        department: "all",
        leaderboard,
        totalParticipants: allStats.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch leaderboard",
    });
  }
});

// GET /badges - Get all available badges
leaderboardRouter.get("/badges", async (_req: Request, res: Response) => {
  try {
    const badges = getAllBadges().map(({ check, ...rest }) => rest);

    res.json({
      success: true,
      data: {
        badges,
        totalBadges: badges.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch badges",
    });
  }
});

// GET /badges/:studentId - Get student's earned badges
leaderboardRouter.get("/badges/:studentId", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const earnedBadges = await prisma.studentBadge.findMany({
      where: { studentId },
      orderBy: { earnedAt: "desc" },
    });

    const badgeDetails = earnedBadges.map((eb) => {
      const def = BADGE_DEFINITIONS.find((b) => b.id === eb.badgeId);
      return {
        badgeId: eb.badgeId,
        name: def?.name || eb.badgeId,
        description: def?.description || "",
        icon: def?.icon || "",
        criteria: def?.criteria || "",
        earnedAt: eb.earnedAt,
      };
    });

    const allBadgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));
    const unearnedBadges = BADGE_DEFINITIONS.filter(
      (b) => !earnedIds.has(b.id)
    ).map(({ check, ...rest }) => rest);

    res.json({
      success: true,
      data: {
        studentId,
        earned: badgeDetails,
        earnedCount: badgeDetails.length,
        totalAvailable: allBadgeIds.length,
        unearned: unearnedBadges,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student badges",
    });
  }
});

// POST /badges/:studentId/check - Check and award earned badges
leaderboardRouter.post("/badges/:studentId/check", async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      res.status(404).json({
        success: false,
        error: "Student stats not found. Complete at least one case first.",
      });
      return;
    }

    const departmentPerf = await prisma.departmentStats.findMany({
      where: { studentId },
    });

    const deptStatsMap: Record<string, { total: number; correct: number }> = {};
    for (const d of departmentPerf) {
      deptStatsMap[d.department] = {
        total: d.totalCases,
        correct: d.correctCases,
      };
    }

    // Calculate weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyResults = await prisma.casePracticeResult.findMany({
      where: {
        studentId,
        attemptedAt: { gte: weekAgo },
      },
    });
    const weeklyStats =
      weeklyResults.length > 0
        ? {
            total: weeklyResults.length,
            correct: weeklyResults.filter((r) => r.isCorrect).length,
          }
        : null;

    const studentStatsForEngine: StudentStats = {
      totalCasesPracticed: stats.totalCasesPracticed,
      correctDiagnoses: stats.correctDiagnoses,
      streak: stats.streak,
      accuracy:
        stats.totalCasesPracticed > 0
          ? (stats.correctDiagnoses / stats.totalCasesPracticed) * 100
          : 0,
      fastestCorrectTimeMs: stats.fastestCorrectMs,
      weeklyStats,
      departmentStats: deptStatsMap,
    };

    const existingBadges = await prisma.studentBadge.findMany({
      where: { studentId },
      select: { badgeId: true },
    });
    const earnedIds = existingBadges.map((b) => b.badgeId);

    const newBadges = checkBadges(studentStatsForEngine, earnedIds);

    const awardedBadges = [];
    for (const badge of newBadges) {
      const created = await prisma.studentBadge.create({
        data: {
          id: uuidv4(),
          studentId,
          badgeId: badge.id,
          earnedAt: new Date(),
        },
      });
      awardedBadges.push({
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: created.earnedAt,
      });
    }

    res.json({
      success: true,
      data: {
        studentId,
        newBadgesAwarded: awardedBadges,
        newBadgesCount: awardedBadges.length,
        totalBadgesEarned: earnedIds.length + awardedBadges.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to check badges",
    });
  }
});
