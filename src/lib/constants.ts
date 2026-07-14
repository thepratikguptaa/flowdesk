import type { CaseStatus, Priority } from "@prisma/client";

/** Case categories offered at creation time. */
export const CASE_CATEGORIES = [
  "Complaint",
  "Service Request",
  "Technical Support",
  "Maintenance",
  "Approval",
  "Access / Account",
  "Billing / Accounts",
  "Other",
] as const;

export type CaseCategory = (typeof CASE_CATEGORIES)[number];

/** Human-friendly, zero-padded case reference, e.g. FD-000042. */
export function formatCaseNumber(n: number): string {
  return `FD-${String(n).padStart(6, "0")}`;
}

type Meta = { label: string; className: string };

export const PRIORITY_META: Record<Priority, Meta> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  HIGH: { label: "High", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

export const STATUS_META: Record<CaseStatus, Meta> = {
  SUBMITTED: { label: "Submitted", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  ASSIGNED: { label: "Assigned", className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  WAITING: { label: "Waiting", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  CLOSED: { label: "Closed", className: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  REOPENED: { label: "Reopened", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const STATUSES: CaseStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
];
