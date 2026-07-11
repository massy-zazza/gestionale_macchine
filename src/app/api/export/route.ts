import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [vehicles, refuels, expenses, maintenances, reminders] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.refuel.findMany(),
    prisma.expense.findMany(),
    prisma.maintenance.findMany(),
    prisma.reminder.findMany(),
  ]);
  return NextResponse.json({ vehicles, refuels, expenses, maintenances, reminders });
}
