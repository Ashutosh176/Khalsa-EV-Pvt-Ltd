import path from "node:path";
import { config } from "dotenv";
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Section 24 - editable from admin afterwards, this only guarantees the
// taxonomy exists on a fresh database. Not product data (Section 48).
const CATEGORIES = [
  "Batteries",
  "Motors",
  "Controllers",
  "Chargers",
  "Brakes",
  "Suspension",
  "Tyres",
  "Lights",
  "Electrical Components",
  "Body Parts",
  "Accessories",
  "Electric Scooters",
];

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seedSuperAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env before seeding.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: "Khalsa EV Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`Created super admin: ${email}`);
}

async function seedCategories() {
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  console.log(`Ensured ${CATEGORIES.length} base categories exist.`);
}

async function main() {
  await seedSuperAdmin();
  await seedCategories();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
