import bcrypt from "bcryptjs";
import {
  PrismaClient,
  type Role,
  type CaseStatus,
  type Priority,
  type CaseEventType,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

const DEPARTMENTS = [
  { name: "IT Support", description: "Hardware, software, and network requests" },
  { name: "Human Resources", description: "HR issues, leave, and disputes" },
  { name: "Maintenance", description: "Facilities and equipment upkeep" },
  { name: "Accounts", description: "Reimbursements and financial approvals" },
  { name: "Library", description: "Library access and resource requests" },
  { name: "Hostel", description: "Hostel complaints and accommodation" },
];

// Emails are kept stable (the login demo buttons reference them); names are
// Indian names as requested.
const USERS: {
  name: string;
  email: string;
  role: Role;
  dept: string | null;
}[] = [
  { name: "Rahul Sharma", email: "admin@flowdesk.dev", role: "ADMIN", dept: null },
  { name: "Priya Verma", email: "manager.it@flowdesk.dev", role: "MANAGER", dept: "IT Support" },
  { name: "Vikram Nair", email: "manager.hr@flowdesk.dev", role: "MANAGER", dept: "Human Resources" },
  { name: "Deepa Menon", email: "manager.maint@flowdesk.dev", role: "MANAGER", dept: "Maintenance" },
  { name: "Anjali Joshi", email: "manager.accounts@flowdesk.dev", role: "MANAGER", dept: "Accounts" },
  { name: "Amit Patel", email: "staff.it@flowdesk.dev", role: "STAFF", dept: "IT Support" },
  { name: "Karan Mehta", email: "staff.it2@flowdesk.dev", role: "STAFF", dept: "IT Support" },
  { name: "Neha Gupta", email: "staff.hr@flowdesk.dev", role: "STAFF", dept: "Human Resources" },
  { name: "Suresh Rao", email: "staff.maint@flowdesk.dev", role: "STAFF", dept: "Maintenance" },
  { name: "Rohan Desai", email: "staff.accounts@flowdesk.dev", role: "STAFF", dept: "Accounts" },
  { name: "Kavya Reddy", email: "staff.library@flowdesk.dev", role: "STAFF", dept: "Library" },
  { name: "Arjun Singh", email: "staff.hostel@flowdesk.dev", role: "STAFF", dept: "Hostel" },
  { name: "Ananya Iyer", email: "citizen@flowdesk.dev", role: "CITIZEN", dept: null },
  { name: "Sneha Kulkarni", email: "citizen2@flowdesk.dev", role: "CITIZEN", dept: null },
  { name: "Manish Agarwal", email: "citizen3@flowdesk.dev", role: "CITIZEN", dept: null },
];

// Realistic case titles + category per department.
const CASE_TEMPLATES: Record<string, { title: string; category: string }[]> = {
  "IT Support": [
    { title: "Laptop won't boot after the latest update", category: "Technical Support" },
    { title: "VPN keeps disconnecting every few minutes", category: "Technical Support" },
    { title: "Locked out of my email account", category: "Access / Account" },
    { title: "Monitor flickering at workstation 14", category: "Technical Support" },
    { title: "Software licence request for design tools", category: "Service Request" },
    { title: "Wi-Fi dead in conference room B", category: "Technical Support" },
    { title: "Printer on the 3rd floor is offline", category: "Technical Support" },
    { title: "Need access to the shared finance drive", category: "Access / Account" },
  ],
  "Human Resources": [
    { title: "Leave balance shows the wrong number of days", category: "Complaint" },
    { title: "Dispute over this month's shift allocation", category: "Complaint" },
    { title: "Request for an experience letter", category: "Service Request" },
    { title: "Update my emergency contact details", category: "Service Request" },
    { title: "Payslip not received for last month", category: "Complaint" },
    { title: "Approval needed for work-from-home request", category: "Approval" },
  ],
  Maintenance: [
    { title: "AC not cooling in Lab 2", category: "Maintenance" },
    { title: "Broken chair in the reception area", category: "Maintenance" },
    { title: "Water leakage in the ground-floor restroom", category: "Maintenance" },
    { title: "Ceiling light not working in Room 210", category: "Maintenance" },
    { title: "Door lock jammed on the 2nd floor", category: "Maintenance" },
    { title: "Pest control request for the cafeteria", category: "Service Request" },
  ],
  Accounts: [
    { title: "Reimbursement for travel expenses", category: "Billing / Accounts" },
    { title: "Vendor invoice approval pending", category: "Approval" },
    { title: "Incorrect tax deduction on salary", category: "Billing / Accounts" },
    { title: "Advance requested for the annual conference", category: "Approval" },
    { title: "Duplicate charge on the corporate card", category: "Billing / Accounts" },
  ],
  Library: [
    { title: "Unable to access the e-journals portal", category: "Access / Account" },
    { title: "Book return marked incorrectly", category: "Complaint" },
    { title: "Request to add new textbook titles", category: "Service Request" },
    { title: "Library card not scanning at the gate", category: "Access / Account" },
    { title: "Fine waiver request for a delayed return", category: "Approval" },
  ],
  Hostel: [
    { title: "Room heater not working in Block C", category: "Maintenance" },
    { title: "Request for a room change", category: "Service Request" },
    { title: "Mess food quality complaint", category: "Complaint" },
    { title: "Weak Wi-Fi signal in Block C", category: "Technical Support" },
    { title: "Plumbing issue in the shared bathroom", category: "Maintenance" },
  ],
};

const DESCRIPTIONS = [
  "This has been happening for a couple of days now and it's blocking my work. Could someone take a look when possible?",
  "Reporting this so it's on record. Happy to share more details or screenshots if that helps.",
  "It started this morning and hasn't resolved on its own. Please advise on the next steps.",
  "Raising this on behalf of the team — several people are affected, not just me.",
  "Tried the usual fixes but no luck. Would appreciate someone from the department looking into it.",
];

const COMMENTS = [
  "Thanks for reporting — taking a look now.",
  "Could you share a bit more detail on when this started?",
  "Assigned to me, I'll update by end of day.",
  "This should be fixed now, please confirm on your end.",
  "Escalating this to the manager for approval.",
  "Waiting on a part/response, will follow up shortly.",
];

const STATUS_POOL: CaseStatus[] = [
  "SUBMITTED", "SUBMITTED",
  "UNDER_REVIEW", "UNDER_REVIEW",
  "ASSIGNED", "ASSIGNED",
  "IN_PROGRESS", "IN_PROGRESS", "IN_PROGRESS",
  "WAITING",
  "RESOLVED", "RESOLVED", "RESOLVED",
  "CLOSED", "CLOSED",
  "REOPENED",
];

const PRIORITY_POOL: Priority[] = [
  "LOW", "LOW",
  "MEDIUM", "MEDIUM", "MEDIUM",
  "HIGH", "HIGH",
  "URGENT",
];

const OPEN_STATUSES: CaseStatus[] = [
  "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "WAITING", "REOPENED",
];

// Statuses that imply the case has already been picked up by someone.
const ASSIGNED_STATUSES: CaseStatus[] = [
  "ASSIGNED", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "REOPENED",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3_600_000);
}
function addDays(d: Date, days: number): Date {
  return addHours(d, days * 24);
}

async function main() {
  console.log("🌱 Seeding FlowDesk…");
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Departments (idempotent by unique name).
  const departments = await Promise.all(
    DEPARTMENTS.map((d) =>
      prisma.department.upsert({
        where: { name: d.name },
        update: { description: d.description },
        create: d,
      }),
    ),
  );
  const deptByName = new Map(departments.map((d) => [d.name, d]));
  console.log(`  ✓ ${departments.length} departments`);

  // Users (idempotent by email).
  const users = await Promise.all(
    USERS.map((u) => {
      const departmentId = u.dept ? deptByName.get(u.dept)!.id : null;
      return prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role, departmentId },
        create: { name: u.name, email: u.email, role: u.role, departmentId, passwordHash },
      });
    }),
  );
  console.log(`  ✓ ${users.length} users (password for all: ${DEMO_PASSWORD})`);

  // Handy lookups.
  const staffByDept = new Map<string, typeof users>();
  for (const d of departments) {
    staffByDept.set(
      d.id,
      users.filter(
        (u) => u.departmentId === d.id && (u.role === "STAFF" || u.role === "MANAGER"),
      ),
    );
  }
  const citizens = users.filter((u) => u.role === "CITIZEN");
  const reporterPool = [...citizens, ...citizens, ...users]; // citizens weighted higher
  const admin = users.find((u) => u.role === "ADMIN")!;

  // Reset previously-seeded cases so re-running stays clean (cascades events,
  // comments, attachments, and notifications). Audit rows are independent
  // (case is deleted with SetNull on entityId's relation? no — audit stores
  // plain ids), so clear them explicitly too.
  await prisma.case.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // Collected audit rows are inserted in one batch at the end. Shapes mirror
  // exactly what the real server actions write (see src/lib/audit.ts callers),
  // so the /audit page renders them identically.
  type AuditRow = {
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    field?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    createdAt: Date;
  };
  const auditRows: AuditRow[] = [];

  // Backfill setup history: departments and users were "created" before any
  // cases, so stamp them earliest (mirrors admin bootstrapping the system).
  const setupBase = addDays(now, -60);
  departments.forEach((d, i) => {
    auditRows.push({
      userId: admin.id,
      action: "department.create",
      entityType: "Department",
      entityId: d.id,
      newValue: d.name,
      createdAt: addHours(setupBase, i),
    });
  });
  users.forEach((u, i) => {
    if (u.id === admin.id) return; // admin is the actor, not a created-by-admin row
    auditRows.push({
      userId: admin.id,
      action: "user.create",
      entityType: "User",
      entityId: u.id,
      newValue: `${u.email} · ${u.role}`,
      createdAt: addHours(setupBase, departments.length + i),
    });
  });

  let created = 0;
  let eventCount = 0;
  let commentCount = 0;

  // Generate a spread of cases per department across the last 8 weeks.
  for (const dept of departments) {
    const templates = CASE_TEMPLATES[dept.name] ?? [];
    const deptStaff = staffByDept.get(dept.id) ?? [];
    const count = randInt(11, 15);

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const status = pick(STATUS_POOL);
      const priority = pick(PRIORITY_POOL);
      const reporter = pick(reporterPool);
      const isOpen = OPEN_STATUSES.includes(status);
      const ageDays = randInt(0, 55);
      const createdAt = addHours(addDays(now, -ageDays), -randInt(0, 23));

      const assignee =
        ASSIGNED_STATUSES.includes(status) && deptStaff.length > 0
          ? pick(deptStaff)
          : null;

      // Resolution timestamps for resolved/closed cases (drives avg-resolution).
      let resolvedAt: Date | null = null;
      let closedAt: Date | null = null;
      if (status === "RESOLVED" || status === "CLOSED") {
        resolvedAt = addHours(createdAt, randInt(3, 24 * 6));
        if (resolvedAt > now) resolvedAt = addHours(createdAt, 6);
        if (status === "CLOSED") {
          closedAt = addHours(resolvedAt, randInt(2, 48));
          if (closedAt > now) closedAt = resolvedAt;
        }
      }

      // Due date on ~60% of cases; open older cases are sometimes overdue.
      let dueDate: Date | null = null;
      if (Math.random() < 0.6) {
        if (isOpen && ageDays > 10 && Math.random() < 0.5) {
          dueDate = addDays(now, -randInt(1, 7)); // overdue
        } else {
          dueDate = addDays(now, randInt(2, 21)); // upcoming
        }
      }

      const kase = await prisma.case.create({
        data: {
          title: template.title,
          description: pick(DESCRIPTIONS),
          category: template.category,
          priority,
          status,
          dueDate,
          reporterId: reporter.id,
          assigneeId: assignee?.id ?? null,
          departmentId: dept.id,
          createdAt,
          resolvedAt,
          closedAt,
        },
      });
      created++;

      // Audit trail — one row per meaningful action, matching the real actions.
      auditRows.push({
        userId: reporter.id,
        action: "case.create",
        entityType: "Case",
        entityId: kase.id,
        newValue: template.title,
        createdAt,
      });
      if (assignee) {
        auditRows.push({
          userId: assignee.id,
          action: "case.assign",
          entityType: "Case",
          entityId: kase.id,
          field: "assigneeId",
          oldValue: null,
          newValue: assignee.id,
          createdAt: addHours(createdAt, randInt(1, 24)),
        });
      }
      // Status progression: submitted → (…) → current status, one row per hop.
      if (status !== "SUBMITTED") {
        const finalAt = closedAt ?? resolvedAt ?? addHours(createdAt, randInt(2, 48));
        auditRows.push({
          userId: assignee?.id ?? admin.id,
          action: "case.status",
          entityType: "Case",
          entityId: kase.id,
          field: "status",
          oldValue: "SUBMITTED",
          newValue: status,
          createdAt: finalAt > now ? now : finalAt,
        });
      }

      // Timeline events.
      const events: {
        caseId: string;
        actorId: string | null;
        type: CaseEventType;
        message: string;
        createdAt: Date;
      }[] = [
        {
          caseId: kase.id,
          actorId: reporter.id,
          type: "CREATED",
          message: `${reporter.name} submitted the case`,
          createdAt,
        },
      ];
      if (assignee) {
        events.push({
          caseId: kase.id,
          actorId: assignee.id,
          type: "ASSIGNED",
          message: `Assigned to ${assignee.name}`,
          createdAt: addHours(createdAt, randInt(1, 24)),
        });
      }
      if (resolvedAt) {
        events.push({
          caseId: kase.id,
          actorId: assignee?.id ?? null,
          type: status === "CLOSED" ? "CLOSED" : "STATUS_CHANGED",
          message: status === "CLOSED" ? "Case closed" : "Case resolved",
          createdAt: closedAt ?? resolvedAt,
        });
      }
      await prisma.caseEvent.createMany({ data: events });
      eventCount += events.length;

      // Comments on ~40% of cases.
      if (assignee && Math.random() < 0.4) {
        const n = randInt(1, 2);
        const comments = Array.from({ length: n }, (_, k) => ({
          caseId: kase.id,
          authorId: k % 2 === 0 ? assignee.id : reporter.id,
          body: pick(COMMENTS),
          createdAt: addHours(createdAt, randInt(2, 72)),
        }));
        await prisma.comment.createMany({ data: comments });
        commentCount += comments.length;
      }
    }
  }

  await prisma.auditLog.createMany({ data: auditRows });

  console.log(`  ✓ ${created} cases, ${eventCount} timeline events, ${commentCount} comments`);
  console.log(`  ✓ ${auditRows.length} audit-log entries`);
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
