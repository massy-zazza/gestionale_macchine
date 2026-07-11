import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.mileageRecord.deleteMany();
  await prisma.refuel.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.vehicle.deleteMany();

  const categories = [
    ["carburante", "#0f766e", true],
    ["manutenzione ordinaria", "#7c3aed", false],
    ["assicurazione", "#2563eb", false],
    ["bollo", "#ea580c", false],
    ["revisione", "#0891b2", false],
    ["pneumatici", "#4d7c0f", false],
    ["lavaggio", "#0284c7", false],
    ["parcheggio", "#9333ea", false],
    ["pedaggio", "#ca8a04", false],
    ["multa", "#dc2626", false],
    ["accessori", "#475569", false],
    ["ricambi", "#a16207", false],
    ["altre spese", "#6b7280", false],
  ] as const;

  for (const [name, color, isFuel] of categories) {
    await prisma.expenseCategory.create({ data: { name, color, isFuel, isDefault: true } });
  }

  await prisma.vehicle.create({
    data: {
      make: "BMW",
      model: "116i",
      year: 2015,
      fuelType: "BENZINA",
      initialMileageKm: 0,
      currentMileageKm: 0,
      isActive: true,
    },
  });
}

main().finally(async () => prisma.$disconnect());
