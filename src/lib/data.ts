import { prisma } from "@/lib/prisma";

export async function getBaseData() {
  const [vehicles, categories] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.expenseCategory.findMany(),
  ]);
  return { vehicles, categories, activeVehicle: vehicles.find((vehicle) => vehicle.isActive) ?? vehicles[0] ?? null };
}
