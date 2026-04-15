import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const scheduleRouter = Router();

const scheduleSchema = z.object({
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  maxPatients: z.number().int().min(1).optional(),
});

// POST / - Create/update doctor schedule
scheduleRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = scheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const { doctorId, hospitalId, dayOfWeek, startTime, endTime, maxPatients } = parsed.data;

    const existing = await prisma.doctorSchedule.findFirst({
      where: { doctorId, hospitalId, dayOfWeek, startTime, endTime },
    });

    let schedule;
    if (existing) {
      schedule = await prisma.doctorSchedule.update({
        where: { id: existing.id },
        data: { maxPatients },
      });
    } else {
      schedule = await prisma.doctorSchedule.create({
        data: {
          id: uuidv4(),
          doctorId,
          hospitalId,
          dayOfWeek,
          startTime,
          endTime,
          maxPatients,
        },
      });
    }

    res.status(existing ? 200 : 201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /:doctorId - Get doctor's schedule for all days
scheduleRouter.get("/:doctorId", async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const byDay: Record<string, typeof schedules> = {};

    for (const s of schedules) {
      const dayName = dayNames[s.dayOfWeek];
      if (!byDay[dayName]) byDay[dayName] = [];
      byDay[dayName].push(s);
    }

    res.json({ success: true, data: { doctorId, schedule: byDay } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE /:id - Remove a schedule slot
scheduleRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const schedule = await prisma.doctorSchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!schedule) {
      res.status(404).json({ success: false, error: "Schedule slot not found" });
      return;
    }

    await prisma.doctorSchedule.delete({ where: { id: req.params.id } });

    res.json({ success: true, data: { deleted: true, id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
