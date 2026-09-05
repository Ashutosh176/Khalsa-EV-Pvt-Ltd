import path from "node:path";
import { config } from "dotenv";
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { BatteryType, PrismaClient, ProductStatus, ProductType, Role } from "@prisma/client";
import { slugify } from "@khalsa-ev/utils";
import { DEFAULT_WAREHOUSE_CODE } from "../src/common/constants";

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

async function seedDefaultWarehouse() {
  await prisma.warehouse.upsert({
    where: { code: DEFAULT_WAREHOUSE_CODE },
    update: {},
    create: { code: DEFAULT_WAREHOUSE_CODE, name: "Main Warehouse" },
  });
  console.log(`Ensured default warehouse "${DEFAULT_WAREHOUSE_CODE}" exists.`);
}

// Demo content for the Electric Scooters storefront section (Section 60) -
// ProductType.SCOOTER + ScooterSpecification have existed in the schema
// since Phase 5, but nothing had ever populated or queried them until this
// section shipped. Uses PrismaClient directly (like the rest of this file),
// bypassing CreateProductDto's admin-API restriction to SPARE_PART/ACCESSORY
// - that restriction guards the admin UI's incomplete scooter form, not the
// data model, which has always fully supported this shape.
const SCOOTER_STOCK = 12;

type ScooterSeed = {
  sku: string;
  name: string;
  description: string;
  brandName: string;
  price: number; // paise
  mrp: number; // paise
  isFeatured?: boolean;
  spec: {
    model: string;
    batteryCapacityAh: number;
    batteryCapacityWh: number;
    batteryType: BatteryType;
    motorPowerW: number;
    topSpeedKmh: number;
    rangeKm: number;
    chargingTimeHours: number;
    brakingType: string;
    tyreType: string;
    tyreSize: string;
    suspension: string;
    kerbWeightKg: number;
    loadCapacityKg: number;
    seatHeightMm: number;
    groundClearanceMm: number;
    warrantyTerms: string;
    highlightFeatures: string[];
  };
};

const SCOOTERS: ScooterSeed[] = [
  {
    sku: "KEV-SCT-VOLT-ACE",
    name: "Khalsa Volt Ace",
    description:
      "A confident daily rider built for city commutes - strong mid-range power, a long real-world range, and a low seat height that suits most riders.",
    brandName: "Khalsa Volt",
    price: 89_999_00,
    mrp: 99_999_00,
    isFeatured: true,
    spec: {
      model: "Volt Ace",
      batteryCapacityAh: 30,
      batteryCapacityWh: 1500,
      batteryType: BatteryType.LI_ION,
      motorPowerW: 1200,
      topSpeedKmh: 55,
      rangeKm: 90,
      chargingTimeHours: 4.5,
      brakingType: "Disc (Front) + Drum (Rear)",
      tyreType: "Tubeless",
      tyreSize: "90/90-12",
      suspension: "Telescopic Front, Dual Shock Rear",
      kerbWeightKg: 98,
      loadCapacityKg: 150,
      seatHeightMm: 780,
      groundClearanceMm: 165,
      warrantyTerms: "3 years or 30,000 km, whichever is earlier",
      highlightFeatures: ["Digital Display", "Reverse Mode", "USB Charging Port", "Anti-theft Alarm"],
    },
  },
  {
    sku: "KEV-SCT-VOLT-CITY",
    name: "Khalsa Volt City",
    description: "An affordable, lightweight scooter for short city hops, with practical under-seat storage.",
    brandName: "Khalsa Volt",
    price: 74_999_00,
    mrp: 79_999_00,
    spec: {
      model: "Volt City",
      batteryCapacityAh: 24,
      batteryCapacityWh: 1200,
      batteryType: BatteryType.LI_ION,
      motorPowerW: 950,
      topSpeedKmh: 45,
      rangeKm: 70,
      chargingTimeHours: 4,
      brakingType: "Drum (Front & Rear)",
      tyreType: "Tubeless",
      tyreSize: "90/90-10",
      suspension: "Telescopic Front, Spring Rear",
      kerbWeightKg: 88,
      loadCapacityKg: 140,
      seatHeightMm: 760,
      groundClearanceMm: 155,
      warrantyTerms: "2 years or 20,000 km, whichever is earlier",
      highlightFeatures: ["LED Headlamp", "Mobile Charging Port", "Under-seat Storage"],
    },
  },
  {
    sku: "KEV-SCT-RACER-R3",
    name: "Khalsa Racer R3",
    description:
      "The performance flagship - a bigger LFP pack, a punchy motor, and a full digital cockpit for riders who want range and speed together.",
    brandName: "Khalsa Racer",
    price: 129_999_00,
    mrp: 139_999_00,
    isFeatured: true,
    spec: {
      model: "Racer R3",
      batteryCapacityAh: 40,
      batteryCapacityWh: 2500,
      batteryType: BatteryType.LFP,
      motorPowerW: 2500,
      topSpeedKmh: 75,
      rangeKm: 120,
      chargingTimeHours: 5,
      brakingType: "Disc (Front & Rear) with CBS",
      tyreType: "Tubeless",
      tyreSize: "100/80-14",
      suspension: "USD Front Fork, Mono-shock Rear",
      kerbWeightKg: 112,
      loadCapacityKg: 160,
      seatHeightMm: 790,
      groundClearanceMm: 170,
      warrantyTerms: "3 years or 40,000 km, whichever is earlier",
      highlightFeatures: ["TFT Touchscreen", "GPS Navigation", "Cruise Control", "Fast Charging (0-80% in 90 min)"],
    },
  },
];

async function seedScooterProducts() {
  const category = await prisma.category.findUnique({ where: { slug: "electric-scooters" } });
  const warehouse = await prisma.warehouse.findUnique({ where: { code: DEFAULT_WAREHOUSE_CODE } });
  if (!category || !warehouse) {
    throw new Error("seedScooterProducts requires categories and the default warehouse to be seeded first.");
  }

  for (const scooter of SCOOTERS) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(scooter.brandName) },
      update: { name: scooter.brandName },
      create: { name: scooter.brandName, slug: slugify(scooter.brandName) },
    });

    const product = await prisma.product.upsert({
      where: { sku: scooter.sku },
      update: {},
      create: {
        sku: scooter.sku,
        slug: slugify(scooter.name),
        name: scooter.name,
        description: scooter.description,
        productType: ProductType.SCOOTER,
        status: ProductStatus.ACTIVE,
        categoryId: category.id,
        brandId: brand.id,
        price: scooter.price,
        mrp: scooter.mrp,
        gstPercent: 5,
        warrantyMonths: 36,
        isFeatured: scooter.isFeatured ?? false,
        scooterSpec: { create: scooter.spec },
      },
      include: { scooterSpec: true },
    });

    // upsert's nested `scooterSpec.create` only runs on the create branch -
    // back-fill it on a re-run against a product that predates this field.
    if (!product.scooterSpec) {
      await prisma.scooterSpecification.create({ data: { productId: product.id, ...scooter.spec } });
    }

    const hasInventory = await prisma.inventory.findFirst({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    if (!hasInventory) {
      await prisma.inventory.create({
        data: { productId: product.id, warehouseId: warehouse.id, currentStock: SCOOTER_STOCK },
      });
    }
  }
  console.log(`Ensured ${SCOOTERS.length} demo scooter products exist.`);
}

async function main() {
  await seedSuperAdmin();
  await seedCategories();
  await seedDefaultWarehouse();
  await seedScooterProducts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
