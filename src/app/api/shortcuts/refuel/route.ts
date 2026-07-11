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
  const liters = Number(body.litri ?? body.liters);
  const total = Number(body.importo ?? body.total);
  await prisma.refuel.create({
    data: {
      vehicleId: vehicle.id,
      date: new Date(body.data ?? body.date ?? Date.now()),
      odometerKm: Number(body.chilometraggio ?? body.odometerKm),
      litersMl: Math.round(liters * 1000),
      totalCents: Math.round(total * 100),
      pricePerLiterMilliCents: Math.round(Number(body.prezzoAlLitro ?? body.pricePerLiter ?? total / liters) * 100000),
      station: body.distributore ?? body.station,
      notes: body.note ?? body.notes,
      fullTank: Boolean(body.pienoCompleto ?? body.fullTank ?? true),
    },
  });
  return NextResponse.json({ success: true, message: "Rifornimento aggiunto correttamente" });
}
