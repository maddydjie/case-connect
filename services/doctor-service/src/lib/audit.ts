import { prisma } from "./prisma";
import { v4 as uuidv4 } from "uuid";

interface AuditLogParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        id: uuidv4(),
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        previousData: params.previousData ?? undefined,
        newData: params.newData ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
