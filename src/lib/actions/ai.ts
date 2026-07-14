"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { canViewCase } from "@/lib/auth/rbac";
import { chatComplete, isAIConfigured } from "@/lib/ai/azure";
import { formatCaseNumber, STATUS_META, PRIORITY_META } from "@/lib/constants";

export type SummaryState = { summary?: string; error?: string };

const SYSTEM_PROMPT = `You are an assistant helping a busy operations manager triage support cases.
Summarize the case in 3-5 short sentences. Cover: the core issue, the current status,
and the most important next action or blocker. Be concrete and neutral. Do not invent
facts that aren't in the case. Do not restate every metadata field.`;

export async function summarizeCase(caseId: string): Promise<SummaryState> {
  const user = await requireUser();

  if (!isAIConfigured()) {
    return { error: "AI summaries aren’t configured on this deployment." };
  }

  const kase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      reporter: { select: { name: true } },
      assignee: { select: { name: true } },
      department: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!kase || !canViewCase(user, kase)) return { error: "Case not found." };

  // Build a compact, factual context for the model.
  const context = [
    `Case ${formatCaseNumber(kase.caseNumber)}: ${kase.title}`,
    `Category: ${kase.category}`,
    `Status: ${STATUS_META[kase.status].label}`,
    `Priority: ${PRIORITY_META[kase.priority].label}`,
    `Department: ${kase.department.name}`,
    `Reporter: ${kase.reporter.name ?? "Unknown"}`,
    `Assignee: ${kase.assignee?.name ?? "Unassigned"}`,
    kase.dueDate ? `Due: ${kase.dueDate.toISOString().slice(0, 10)}` : null,
    "",
    `Description:\n${kase.description}`,
    "",
    kase.comments.length
      ? "Comments:\n" +
        kase.comments
          .map((c) => `- ${c.author.name ?? "User"}: ${c.body}`)
          .join("\n")
      : "Comments: none",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const text = await chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context },
    ]);
    return { summary: text.trim() };
  } catch (err) {
    console.error("[ai] summarizeCase failed", err);
    return { error: "Couldn’t generate a summary right now. Please try again." };
  }
}
