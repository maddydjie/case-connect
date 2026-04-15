import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const appointmentRouter = Router();

const bookSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.string().min(1),
  reason: z.string().optional(),
  priority: z.number().int().min(1).max(5).default(3),
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no-show"]),
});

// POST / - Book appointment
appointmentRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const { doctorId, date, startTime, endTime, priority, ...rest } = parsed.data;

    const conflicts = await prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: { in: ["scheduled", "confirmed"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflicts.length > 0) {
      const higherPriorityConflict = conflicts.some((c) => (c as any).priority <= priority);

      if (higherPriorityConflict) {
        const waitlistEntry = await prisma.waitlistEntry.create({
          data: {
            id: uuidv4(),
            ...rest,
            doctorId,
            date,
            startTime,
            endTime,
            priority,
            status: "waiting",
            addedAt: new Date(),
          },
        });

        res.status(202).json({
          success: true,
          data: waitlistEntry,
          message: "Time slot has a conflict. Added to waitlist.",
        });
        return;
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        id: uuidv4(),
        ...rest,
        doctorId,
        date,
        startTime,
        endTime,
        priority,
        status: "scheduled",
        createdAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET / - List appointments with filters
appointmentRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { doctorId, patientId, date, status } = req.query;

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (date) where.date = date;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /slots/:doctorId - Available slots for a doctor on a given date
appointmentRouter.get("/slots/:doctorId", async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ success: false, error: "date query parameter is required" });
      return;
    }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    const schedule = await prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek },
    });

    if (schedule.length === 0) {
      res.json({ success: true, data: { availableSlots: [], message: "Doctor not scheduled on this day" } });
      return;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: date as string,
        status: { in: ["scheduled", "confirmed"] },
      },
      orderBy: { startTime: "asc" },
    });

    const availableSlots: Array<{ startTime: string; endTime: string }> = [];

    for (const slot of schedule) {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;

      const conflicting = existingAppointments.filter(
        (apt) => apt.startTime < slotEnd && apt.endTime > slotStart
      );

      if (conflicting.length === 0) {
        availableSlots.push({ startTime: slotStart, endTime: slotEnd });
      } else if (slot.maxPatients && conflicting.length < slot.maxPatients) {
        availableSlots.push({ startTime: slotStart, endTime: slotEnd });
      }
    }

    res.json({ success: true, data: { date, doctorId, availableSlots } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /waitlist/:doctorId - Get waitlist for a doctor
appointmentRouter.get("/waitlist/:doctorId", async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const waitlist = await prisma.waitlistEntry.findMany({
      where: { doctorId, status: "waiting" },
      include: { patient: true },
      orderBy: [{ priority: "asc" }, { addedAt: "asc" }],
    });

    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /waitlist/:id/promote - Promote from waitlist to scheduled
appointmentRouter.post("/waitlist/:id/promote", async (req: Request, res: Response) => {
  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: req.params.id },
    });

    if (!entry) {
      res.status(404).json({ success: false, error: "Waitlist entry not found" });
      return;
    }

    if (entry.status !== "waiting") {
      res.status(409).json({ success: false, error: `Entry status is ${entry.status}, not waiting` });
      return;
    }

    const [appointment, _] = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          id: uuidv4(),
          patientId: entry.patientId,
          doctorId: entry.doctorId,
          hospitalId: entry.hospitalId,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          type: (entry as any).type || "general",
          priority: entry.priority,
          status: "scheduled",
          createdAt: new Date(),
        },
      }),
      prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: "promoted", promotedAt: new Date() },
      }),
    ]);

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /:id - Single appointment
appointmentRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });

    if (!appointment) {
      res.status(404).json({ success: false, error: "Appointment not found" });
      return;
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /:id/status - Update appointment status
appointmentRouter.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      res.status(404).json({ success: false, error: "Appointment not found" });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
