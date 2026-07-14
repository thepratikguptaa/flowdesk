import bcrypt from "bcryptjs";
import { PrismaClient, type Role } from "@prisma/client";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: "IT Support", description: "Hardware, software, and network requests" },
  { name: "Human Resources", description: "HR issues, leave, and disputes" },
  { name: "Maintenance", description: "Facilities and equipment upkeep" },
  { name: "Accounts", description: "Reimbursements and financial approvals" },
  { name: "Library", description: "Library access and resource requests" },
  { name: "Hostel", description: "Hostel complaints and accommodation" },
];

// Shared demo password for every seeded account.
const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("🌱 Seeding FlowDesk…");

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
  const it = departments.find((d) => d.name === "IT Support")!;
  const hr = departments.find((d) => d.name === "Human Resources")!;
  console.log(`  ✓ ${departments.length} departments`);

  const users: Array<{
    name: string;
    email: string;
    role: Role;
    departmentId: string | null;
  }> = [
    { name: "Ada Admin", email: "admin@flowdesk.dev", role: "ADMIN", departmentId: null },
    { name: "Mia Manager (IT)", email: "manager.it@flowdesk.dev", role: "MANAGER", departmentId: it.id },
    { name: "Hank Manager (HR)", email: "manager.hr@flowdesk.dev", role: "MANAGER", departmentId: hr.id },
    { name: "Sam Staff (IT)", email: "staff.it@flowdesk.dev", role: "STAFF", departmentId: it.id },
    { name: "Sara Staff (HR)", email: "staff.hr@flowdesk.dev", role: "STAFF", departmentId: hr.id },
    { name: "Cody Citizen", email: "citizen@flowdesk.dev", role: "CITIZEN", departmentId: null },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, departmentId: u.departmentId },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  ✓ ${users.length} users (password for all: ${DEMO_PASSWORD})`);

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
