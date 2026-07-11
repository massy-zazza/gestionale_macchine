import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function auth(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.SHORTCUTS_API_KEY}`;
}

export async function POST(request: Request) {
  if (!auth(request)) return NextResponse.json({ success: false, error: "API key mancante o non valida" }, { status: 401 });
  const body = await request.json();
  const vehicle = body.vehicleId ? await prisma.vehicle.findUnique({ where: { id: body.vehicleId } }) : await prisma.vehicle.findFirst({ where: { isActive: true } });
  if (!vehicle) return NextResponse.json({ success: false, error: "Nessun veicolo configurato" }, { status: 400 });
  await prisma.mileageRecord.create({ data: { vehicleId: vehicle.id, date: new Date(body.data ?? body.date ?? Date.now()), odometerKm: Number(body.chilometraggio ?? body.odometerKm), source: "COMANDO_RAPIDO", notes: body.note ?? body.notes } });
  return NextResponse.json({ success: true, message: "Chilometraggio aggiunto correttamente" });
}
