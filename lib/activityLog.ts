import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: metadata?.ipAddress as string,
        userAgent: metadata?.userAgent as string,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
