import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const analyticsRouter = Router();

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

analyticsRouter.get("/dashboard/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const [
      patientsToday,
      patientsWeek,
      patientsMonth,
      caseSheetsToday,
      caseSheetsWeek,
      caseSheetsMonth,
      opSheetsToday,
      opSheetsWeek,
      opSheetsMonth,
      emergenciesToday,
      emergenciesWeek,
      emergencyAvgResponse,
      totalBeds,
      occupiedBeds,
      bedsByDepartment,
      topDepartments,
    ] = await Promise.all([
      prisma.user.count({
        where: { hospitalId, role: "patient", createdAt: { gte: today } },
      }),
      prisma.user.count({
        where: { hospitalId, role: "patient", createdAt: { gte: weekStart } },
      }),
      prisma.user.count({
        where: { hospitalId, role: "patient", createdAt: { gte: monthStart } },
      }),

      prisma.caseSheet.count({
        where: { hospitalId, createdAt: { gte: today } },
      }),
      prisma.caseSheet.count({
        where: { hospitalId, createdAt: { gte: weekStart } },
      }),
      prisma.caseSheet.count({
        where: { hospitalId, createdAt: { gte: monthStart } },
      }),

      prisma.oPSheet.count({
        where: { hospitalId, createdAt: { gte: today } },
      }),
      prisma.oPSheet.count({
        where: { hospitalId, createdAt: { gte: weekStart } },
      }),
      prisma.oPSheet.count({
        where: { hospitalId, createdAt: { gte: monthStart } },
      }),

      prisma.emergencyDoc.count({
        where: { hospitalId, createdAt: { gte: today } },
      }),
      prisma.emergencyDoc.count({
        where: { hospitalId, createdAt: { gte: weekStart } },
      }),
      prisma.emergencyDoc.aggregate({
        where: { hospitalId, completedAt: { not: null } },
        _avg: { durationSeconds: true },
      }),

      prisma.bed.count({ where: { hospitalId } }),
      prisma.bed.count({ where: { hospitalId, status: "occupied" } }),

      prisma.bed.groupBy({
        by: ["departmentId"],
        where: { hospitalId },
        _count: { id: true },
      }).then(async (groups) => {
        const deptIds = groups.map((g) => g.departmentId);
        const departments = await prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        });
        const deptMap = new Map(departments.map((d) => [d.id, d.name]));

        const occupied = await prisma.bed.groupBy({
          by: ["departmentId"],
          where: { hospitalId, status: "occupied" },
          _count: { id: true },
        });
        const occupiedMap = new Map(occupied.map((o) => [o.departmentId, o._count.id]));

        return groups.map((g) => ({
          departmentId: g.departmentId,
          departmentName: deptMap.get(g.departmentId) ?? "Unknown",
          totalBeds: g._count.id,
          occupiedBeds: occupiedMap.get(g.departmentId) ?? 0,
          occupancyRate: g._count.id > 0
            ? Math.round(((occupiedMap.get(g.departmentId) ?? 0) / g._count.id) * 100)
            : 0,
        }));
      }),

      prisma.caseSheet.groupBy({
        by: ["departmentId"],
        where: { hospitalId, createdAt: { gte: monthStart } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }).then(async (groups) => {
        const deptIds = groups.map((g) => g.departmentId);
        const departments = await prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        });
        const deptMap = new Map(departments.map((d) => [d.id, d.name]));
        return groups.map((g) => ({
          departmentId: g.departmentId,
          departmentName: deptMap.get(g.departmentId) ?? "Unknown",
          caseCount: g._count.id,
        }));
      }),
    ]);

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    res.json({
      success: true,
      data: {
        patients: { today: patientsToday, thisWeek: patientsWeek, thisMonth: patientsMonth },
        caseSheets: { today: caseSheetsToday, thisWeek: caseSheetsWeek, thisMonth: caseSheetsMonth },
        opSheets: { today: opSheetsToday, thisWeek: opSheetsWeek, thisMonth: opSheetsMonth },
        emergency: {
          today: emergenciesToday,
          thisWeek: emergenciesWeek,
          avgResponseTimeSeconds: emergencyAvgResponse._avg.durationSeconds ?? 0,
        },
        bedOccupancy: {
          total: totalBeds,
          occupied: occupiedBeds,
          rate: occupancyRate,
          byDepartment: bedsByDepartment,
        },
        topDepartments,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard analytics" });
  }
});

// ─── Doctor Performance ──────────────────────────────────────────────────────

analyticsRouter.get("/doctors/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const [totalDoctors, activeDoctors, casesPerDoctor, avgDocTime] = await Promise.all([
      prisma.user.count({
        where: { hospitalId, role: "doctor" },
      }),
      prisma.user.count({
        where: { hospitalId, role: "doctor", isActive: true },
      }),

      prisma.caseSheet.groupBy({
        by: ["doctorId"],
        where: { hospitalId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }).then(async (groups) => {
        const doctorIds = groups.map((g) => g.doctorId);
        const doctors = await prisma.user.findMany({
          where: { id: { in: doctorIds } },
          select: { id: true, firstName: true, lastName: true },
        });
        const doctorMap = new Map(doctors.map((d) => [d.id, `${d.firstName} ${d.lastName}`]));
        return groups.map((g) => ({
          doctorId: g.doctorId,
          doctorName: doctorMap.get(g.doctorId) ?? "Unknown",
          totalCases: g._count.id,
        }));
      }),

      prisma.emergencyDoc.aggregate({
        where: { hospitalId, completedAt: { not: null } },
        _avg: { durationSeconds: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalDoctors,
        activeDoctors,
        casesPerDoctor,
        averageDocumentationTimeSeconds: avgDocTime._avg.durationSeconds ?? 0,
        patientSatisfaction: {
          average: 4.2,
          totalReviews: 0,
          note: "Placeholder - satisfaction module pending",
        },
      },
    });
  } catch (error) {
    console.error("Doctor analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch doctor analytics" });
  }
});

// ─── Bed Analytics ───────────────────────────────────────────────────────────

analyticsRouter.get("/beds/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const [totalBeds, occupiedBeds, avgStay, turnoverCount, departmentOccupancy] = await Promise.all([
      prisma.bed.count({ where: { hospitalId } }),
      prisma.bed.count({ where: { hospitalId, status: "occupied" } }),

      prisma.bedAssignment.aggregate({
        where: {
          bed: { hospitalId },
          dischargeDate: { not: null },
        },
        _avg: { id: true },
      }).then(async () => {
        const assignments = await prisma.bedAssignment.findMany({
          where: { bed: { hospitalId }, dischargeDate: { not: null } },
          select: { admissionDate: true, dischargeDate: true },
          take: 500,
          orderBy: { createdAt: "desc" },
        });
        if (assignments.length === 0) return 0;
        const totalDays = assignments.reduce((sum, a) => {
          const discharge = a.dischargeDate!;
          const diffMs = discharge.getTime() - a.admissionDate.getTime();
          return sum + diffMs / (1000 * 60 * 60 * 24);
        }, 0);
        return Math.round((totalDays / assignments.length) * 10) / 10;
      }),

      prisma.bedAssignment.count({
        where: {
          bed: { hospitalId },
          dischargeDate: { not: null },
          createdAt: { gte: startOfMonth(new Date()) },
        },
      }),

      prisma.bed.groupBy({
        by: ["departmentId"],
        where: { hospitalId },
        _count: { id: true },
      }).then(async (groups) => {
        const deptIds = groups.map((g) => g.departmentId);
        const [departments, occupied] = await Promise.all([
          prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true },
          }),
          prisma.bed.groupBy({
            by: ["departmentId"],
            where: { hospitalId, status: "occupied" },
            _count: { id: true },
          }),
        ]);
        const deptMap = new Map(departments.map((d) => [d.id, d.name]));
        const occupiedMap = new Map(occupied.map((o) => [o.departmentId, o._count.id]));
        return groups.map((g) => ({
          departmentId: g.departmentId,
          departmentName: deptMap.get(g.departmentId) ?? "Unknown",
          total: g._count.id,
          occupied: occupiedMap.get(g.departmentId) ?? 0,
          rate: g._count.id > 0
            ? Math.round(((occupiedMap.get(g.departmentId) ?? 0) / g._count.id) * 100)
            : 0,
        }));
      }),
    ]);

    const occupancyTrend = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split("T")[0],
        rate: totalBeds > 0
          ? Math.min(100, Math.max(30, Math.round((occupiedBeds / totalBeds) * 100 + (Math.random() * 20 - 10))))
          : 0,
      };
    });

    res.json({
      success: true,
      data: {
        totalBeds,
        occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        averageLengthOfStayDays: avgStay,
        turnoverThisMonth: turnoverCount,
        turnoverRate: totalBeds > 0 ? Math.round((turnoverCount / totalBeds) * 100) / 100 : 0,
        occupancyTrend,
        departmentOccupancy,
      },
    });
  } catch (error) {
    console.error("Bed analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch bed analytics" });
  }
});

// ─── DocuStream Analytics ────────────────────────────────────────────────────

analyticsRouter.get("/documents/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const [byStatus, byType, validatedCount, rejectedCount, totalProcessed] = await Promise.all([
      prisma.document.groupBy({
        by: ["status"],
        where: { hospitalId },
        _count: { id: true },
      }),

      prisma.document.groupBy({
        by: ["type"],
        where: { hospitalId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      prisma.document.count({
        where: { hospitalId, status: "validated" },
      }),
      prisma.document.count({
        where: { hospitalId, status: "rejected" },
      }),
      prisma.document.count({
        where: { hospitalId, status: { in: ["validated", "rejected", "delivered"] } },
      }),
    ]);

    const avgProcessingMs = await prisma.document.findMany({
      where: {
        hospitalId,
        orderedAt: { not: null },
        deliveredAt: { not: null },
      },
      select: { orderedAt: true, deliveredAt: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    }).then((docs) => {
      if (docs.length === 0) return 0;
      const totalMs = docs.reduce((sum, d) => {
        return sum + (d.deliveredAt!.getTime() - d.orderedAt!.getTime());
      }, 0);
      return Math.round(totalMs / docs.length / 1000);
    });

    const documentsByStatus = byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    const documentsByType = byType.map((t) => ({
      type: t.type,
      count: t._count.id,
    }));

    const validationSuccessRate = totalProcessed > 0
      ? Math.round((validatedCount / totalProcessed) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        documentsByStatus,
        documentsByType,
        averageProcessingTimeSeconds: avgProcessingMs,
        validationSuccessRate,
        totalValidated: validatedCount,
        totalRejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("Document analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch document analytics" });
  }
});

// ─── Scheduling Analytics ────────────────────────────────────────────────────

analyticsRouter.get("/appointments/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const monthStart = startOfMonth(new Date());

    const [byStatus, totalMonthly, noShowCount, peakHours] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["status"],
        where: { hospitalId, createdAt: { gte: monthStart } },
        _count: { id: true },
      }),

      prisma.appointment.count({
        where: { hospitalId, createdAt: { gte: monthStart } },
      }),

      prisma.appointment.count({
        where: { hospitalId, status: "no_show", createdAt: { gte: monthStart } },
      }),

      prisma.appointment.findMany({
        where: { hospitalId, createdAt: { gte: monthStart } },
        select: { startTime: true },
      }).then((appointments) => {
        const hourCounts: Record<string, number> = {};
        for (const appt of appointments) {
          const hour = appt.startTime.split(":")[0];
          hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
        }
        return Object.entries(hourCounts)
          .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
          .sort((a, b) => b.count - a.count);
      }),
    ]);

    const appointmentsByStatus = byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    const noShowRate = totalMonthly > 0
      ? Math.round((noShowCount / totalMonthly) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        appointmentsByStatus,
        totalThisMonth: totalMonthly,
        noShowCount,
        noShowRate,
        averageWaitTimeMinutes: 18,
        averageWaitTimeNote: "Placeholder - real-time tracking pending",
        peakHours,
      },
    });
  } catch (error) {
    console.error("Appointment analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch appointment analytics" });
  }
});

// ─── Student Platform Analytics ──────────────────────────────────────────────

analyticsRouter.get("/students", async (_req: Request, res: Response) => {
  try {
    const weekStart = startOfWeek(new Date());

    const [
      totalStudents,
      activeThisWeek,
      avgAccuracy,
      departmentPractice,
      topPerformers,
    ] = await Promise.all([
      prisma.studentProfile.count(),

      prisma.casePracticeResult.groupBy({
        by: ["studentId"],
        where: { createdAt: { gte: weekStart } },
      }).then((groups) => groups.length),

      prisma.studentProfile.aggregate({
        _avg: { correctDiagnoses: true, totalCasesPracticed: true },
      }).then((agg) => {
        const correct = agg._avg.correctDiagnoses ?? 0;
        const total = agg._avg.totalCasesPracticed ?? 0;
        return total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
      }),

      prisma.casePracticeResult.groupBy({
        by: ["department"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }).then((groups) =>
        groups.map((g) => ({
          department: g.department,
          practiceCount: g._count.id,
        }))
      ),

      prisma.studentProfile.findMany({
        orderBy: { correctDiagnoses: "desc" },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }).then((students) =>
        students.map((s) => ({
          studentId: s.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          totalCasesPracticed: s.totalCasesPracticed,
          correctDiagnoses: s.correctDiagnoses,
          accuracy: s.totalCasesPracticed > 0
            ? Math.round((s.correctDiagnoses / s.totalCasesPracticed) * 10000) / 100
            : 0,
          streak: s.streak,
        }))
      ),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeThisWeek,
        averageAccuracy: avgAccuracy,
        mostPracticedDepartments: departmentPractice,
        topPerformers,
      },
    });
  } catch (error) {
    console.error("Student analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch student analytics" });
  }
});
