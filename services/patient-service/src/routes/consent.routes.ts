import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";

const router = Router();

const grantConsentSchema = z.object({
  userId: z.string().uuid(),
  purpose: z.string().min(1),
  dataCategories: z.array(z.string()).min(1),
  thirdParties: z.array(z.string()).default([]),
  expiresAt: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date" }),
});

// POST / - Grant consent
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = grantConsentSchema.parse(req.body);

    const consent = await prisma.consent.create({
      data: {
        id: uuidv4(),
        userId: data.userId,
        purpose: data.purpose,
        dataCategories: data.dataCategories,
        thirdParties: data.thirdParties,
        expiresAt: new Date(data.expiresAt),
      },
    });

    res.status(201).json({ success: true, data: consent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to grant consent";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:userId - Get all consents for user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const consents = await prisma.consent.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: consents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get consents";
    res.status(500).json({ success: false, error: message });
  }
});

// PATCH /:id/revoke - Revoke consent
router.patch("/:id/revoke", async (req: Request, res: Response) => {
  try {
    const consent = await prisma.consent.findUnique({
      where: { id: req.params.id },
    });

    if (!consent) {
      res.status(404).json({ success: false, error: "Consent not found" });
      return;
    }

    if (consent.revokedAt) {
      res.status(400).json({ success: false, error: "Consent already revoked" });
      return;
    }

    const updated = await prisma.consent.update({
      where: { id: req.params.id },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke consent";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /:userId/active - Get active (non-revoked, non-expired) consents
router.get("/:userId/active", async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const consents = await prisma.consent.findMany({
      where: {
        userId: req.params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: consents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get active consents";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
