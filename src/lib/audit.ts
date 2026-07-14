import { prisma } from "@/lib/prisma";

type AuditEntry = {
  userId: string | null;
  action: string; // e.g. "department.create", "case.update"
  entityType: string; // "Department", "Case", "User"
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
};

/** Record a single audit-log row. Never throws into the caller's flow. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        field: entry.field,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
      },
    });
  } catch (err) {
    // Audit failures must not break the primary operation; log and continue.
    console.error("[audit] failed to write entry", entry.action, err);
  }
}

/**
 * Record one audit row per changed field by diffing `before`/`after`.
 * Only keys present in `after` are compared.
 */
export async function logFieldChanges(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}): Promise<void> {
  const changes = Object.keys(params.after).filter(
    (key) => params.before[key] !== params.after[key],
  );

  await Promise.all(
    changes.map((field) =>
      logAudit({
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        field,
        oldValue: stringify(params.before[field]),
        newValue: stringify(params.after[field]),
      }),
    ),
  );
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
