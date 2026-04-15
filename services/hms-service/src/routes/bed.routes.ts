import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { emitBedUpdate } from "../lib/socket.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const bedRouter = Router();

const assignSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  reason: z.string().min(1),
});

const statusSchema = z.object({
  status: z.enum(["available", "occupied", "cleaning", "maintenance", "reserved"]),
});

// GET / - Get all beds for a hospital
bedRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { hospitalId, departmentId, status, floor } = req.query;

    const where: Record<string, unknown> = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (floor) where.floor = Number(floor);

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: true,
        currentAssignment: true,
      },
      orderBy: [{ floor: "asc" }, { wardId: "asc" }, { bedNumber: "asc" }],
    });

    const grouped = beds.reduce(
      (acc, bed) => {
        const wardName = (bed as any).ward?.name || "Unassigned";
        if (!acc[wardName]) acc[wardName] = [];
        acc[wardName].push(bed);
        return acc;
      },
      {} as Record<string, typeof beds>
    );

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /map/:hospitalId - Full bed map organized by floor > ward > beds
bedRouter.get("/map/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const beds = await prisma.bed.findMany({
      where: { hospitalId },
      include: {
        ward: true,
        currentAssignment: {
          include: { patient: true },
        },
      },
      orderBy: [{ floor: "asc" }, { bedNumber: "asc" }],
    });

    const floorMap: Record<
      number,
      Record<string, { beds: typeof beds; stats: { total: number; available: number; occupied: number } }>
    > = {};

    for (const bed of beds) {
      const floor = bed.floor;
      const wardName = (bed as any).ward?.name || "General";

      if (!floorMap[floor]) floorMap[floor] = {};
      if (!floorMap[floor][wardName]) {
        floorMap[floor][wardName] = { beds: [], stats: { total: 0, available: 0, occupied: 0 } };
      }

      floorMap[floor][wardName].beds.push(bed);
      floorMap[floor][wardName].stats.total++;
      if (bed.status === "available") floorMap[floor][wardName].stats.available++;
      if (bed.status === "occupied") floorMap[floor][wardName].stats.occupied++;
    }

    const totalStats = {
      total: beds.length,
      available: beds.filter((b) => b.status === "available").length,
      occupied: beds.filter((b) => b.status === "occupied").length,
      cleaning: beds.filter((b) => b.status === "cleaning").length,
      maintenance: beds.filter((b) => b.status === "maintenance").length,
    };

    res.json({ success: true, data: { hospitalId, floors: floorMap, stats: totalStats } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /stats/:hospitalId - Hospital bed statistics
bedRouter.get("/stats/:hospitalId", async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;

    const beds = await prisma.bed.findMany({
      where: { hospitalId },
      include: { ward: { include: { department: true } } },
    });

    const byDepartment: Record<
      string,
      { total: number; available: number; occupied: number; cleaning: number; maintenance: number }
    > = {};

    for (const bed of beds) {
      const dept = (bed as any).ward?.department?.name || "General";
      if (!byDepartment[dept]) {
        byDepartment[dept] = { total: 0, available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
      }
      byDepartment[dept].total++;
      const status = bed.status as keyof (typeof byDepartment)[string];
      if (status in byDepartment[dept]) {
        byDepartment[dept][status]++;
      }
    }

    const totals = {
      total: beds.length,
      available: beds.filter((b) => b.status === "available").length,
      occupied: beds.filter((b) => b.status === "occupied").length,
      cleaning: beds.filter((b) => b.status === "cleaning").length,
      maintenance: beds.filter((b) => b.status === "maintenance").length,
    };

    res.json({ success: true, data: { hospitalId, totals, byDepartment } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /:id - Single bed details
bedRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const bed = await prisma.bed.findUnique({
      where: { id: req.params.id },
      include: {
        ward: { include: { department: true } },
        currentAssignment: {
          include: { patient: true, doctor: true },
        },
      },
    });

    if (!bed) {
      res.status(404).json({ success: false, error: "Bed not found" });
      return;
    }

    res.json({ success: true, data: bed });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /:id/assign - Assign patient to bed
bedRouter.post("/:id/assign", async (req: Request, res: Response) => {
  try {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const { patientId, doctorId, reason } = parsed.data;
    const bedId = req.params.id;

    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) {
      res.status(404).json({ success: false, error: "Bed not found" });
      return;
    }
    if (bed.status !== "available") {
      res.status(409).json({ success: false, error: `Bed is currently ${bed.status}` });
      return;
    }

    const [updatedBed, assignment] = await prisma.$transaction([
      prisma.bed.update({
        where: { id: bedId },
        data: { status: "occupied" },
      }),
      prisma.bedAssignment.create({
        data: {
          id: uuidv4(),
          bedId,
          patientId,
          doctorId,
          reason,
          assignedAt: new Date(),
        },
      }),
    ]);

    emitBedUpdate(bed.hospitalId, {
      bedId,
      status: "occupied",
      patientId,
      assignedAt: assignment.assignedAt,
    });

    res.status(201).json({ success: true, data: { bed: updatedBed, assignment } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /:id/discharge - Discharge patient from bed
bedRouter.post("/:id/discharge", async (req: Request, res: Response) => {
  try {
    const bedId = req.params.id;

    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: { currentAssignment: true },
    });

    if (!bed) {
      res.status(404).json({ success: false, error: "Bed not found" });
      return;
    }
    if (bed.status !== "occupied") {
      res.status(409).json({ success: false, error: "Bed is not currently occupied" });
      return;
    }

    const now = new Date();
    const cleaningEta = new Date(now.getTime() + 30 * 60 * 1000);

    const updateOps: any[] = [
      prisma.bed.update({
        where: { id: bedId },
        data: {
          status: "cleaning",
          cleaningStartedAt: now,
          estimatedCleaningEta: cleaningEta,
        },
      }),
    ];

    if ((bed as any).currentAssignment) {
      updateOps.push(
        prisma.bedAssignment.update({
          where: { id: (bed as any).currentAssignment.id },
          data: { dischargedAt: now },
        })
      );
    }

    const results = await prisma.$transaction(updateOps);

    emitBedUpdate(bed.hospitalId, {
      bedId,
      status: "cleaning",
      cleaningStartedAt: now.toISOString(),
      estimatedCleaningEta: cleaningEta.toISOString(),
    });

    res.json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /:id/status - Update bed status manually
bedRouter.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const bedId = req.params.id;
    const { status } = parsed.data;

    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) {
      res.status(404).json({ success: false, error: "Bed not found" });
      return;
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "available") {
      updateData.cleaningStartedAt = null;
      updateData.estimatedCleaningEta = null;
    }

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: updateData,
    });

    emitBedUpdate(bed.hospitalId, { bedId, status });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
