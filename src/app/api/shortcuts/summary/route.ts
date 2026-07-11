import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.SHORTCUTS_API_KEY}`) {
    return NextResponse.json({ success: false, error: "API key mancante o non valida" }, { status: 401 });
  }
  const [refuels, expenses, mileage, reminders] = await Promise.all([
    prisma.refuel.findMany(),
    prisma.expense.findMany(),
    prisma.mileageRecord.findFirst({ orderBy: { odometerKm: "desc" } }),
    prisma.reminder.findMany({ orderBy: { dueDate: "asc" }, take: 5 }),
  ]);
  return NextResponse.json({
    success: true,
    monthTotalCents: refuels.reduce((s, r) => s + r.totalCents, 0) + expenses.reduce((s, e) => s + e.amountCents, 0),
    latestMileageKm: mileage?.odometerKm ?? 0,
    upcomingReminders: reminders,
  });
}
