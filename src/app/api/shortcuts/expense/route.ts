import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function auth(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.SHORTCUTS_API_KEY}`;
}

export async function POST(request: Request) {
  if (!auth(request)) return NextResponse.json({ success: false, error: "API key mancante o non valida" }, { status: 401 });
  const body = await request.json();
  const vehicle = body.vehicleId ? await prisma.vehicle.findUnique({ where: { id: body.vehicleId } }) : await prisma.vehicle.findFirst({ where: { isActive: true } });
  const category = await prisma.expenseCategory.findFirst({ where: { name: String(body.categoria ?? "altre spese") } }) ?? await prisma.expenseCategory.findFirst();
  if (!vehicle || !category) return NextResponse.json({ success: false, error: "Configurazione incompleta" }, { status: 400 });
  await prisma.expense.create({
    data: {
      vehicleId: vehicle.id,
      categoryId: category.id,
      date: new Date(body.data ?? body.date ?? Date.now()),
      description: String(body.descrizione ?? body.description ?? category.name),
      amountCents: Math.round(Number(body.importo ?? body.amount) * 100),
      notes: body.note ?? body.notes,
    },
  });
  return NextResponse.json({ success: true, message: "Spesa aggiunta correttamente" });
}
