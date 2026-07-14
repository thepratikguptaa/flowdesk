import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type NotifyParams = {
  userIds: Array<string | null | undefined>;
  type: NotificationType;
  message: string;
  caseId?: string;
  /** Actor to exclude (don't notify someone about their own action). */
  exclude?: string;
};

/**
 * Create notifications for a set of users. Deduplicates, drops null/undefined
 * and the acting user, and never throws into the caller's flow.
 */
export async function notify(params: NotifyParams): Promise<void> {
  const recipients = Array.from(
    new Set(params.userIds.filter((id): id is string => !!id && id !== params.exclude)),
  );
  if (recipients.length === 0) return;

  try {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: params.type,
        message: params.message,
        caseId: params.caseId ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifications] failed to create", params.type, err);
  }
}
