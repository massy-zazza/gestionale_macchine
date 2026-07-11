import { addDays, subDays, subMonths } from "date-fns";
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

  const vehicle = await prisma.vehicle.create({
    data: {
      make: "Volkswagen",
      model: "Golf",
      version: "1.5 TSI",
      plate: "AB123CD",
      year: 2021,
      fuelType: "BENZINA",
      purchaseDate: subMonths(new Date(), 18),
      purchasePriceCents: 2350000,
      initialMileageKm: 18500,
      currentMileageKm: 26240,
      tankCapacityLiters: 50,
      notes: "Auto demo modificabile.",
      isActive: true,
    },
  });

  const refuels = [
    [210, 18880, 39.4, 72.1, 1.83, true, "Eni"],
    [175, 19480, 40.1, 72.98, 1.82, true, "Q8"],
    [140, 20120, 38.9, 69.63, 1.79, true, "IP"],
    [106, 20730, 36.6, 65.51, 1.79, true, "Esso"],
    [74, 21320, 28.2, 50.48, 1.79, false, "Eni"],
    [52, 21950, 40.8, 73.03, 1.79, true, "Q8"],
    [25, 22590, 39.5, 70.71, 1.79, true, "IP"],
    [5, 23220, 41.2, 73.75, 1.79, true, "Eni"],
  ] as const;

  for (const [days, odometerKm, liters, total, price, fullTank, station] of refuels) {
    const date = subDays(new Date(), days);
    await prisma.refuel.create({
      data: {
        vehicleId: vehicle.id,
        date,
        odometerKm,
        litersMl: Math.round(liters * 1000),
        totalCents: Math.round(total * 100),
        pricePerLiterMilliCents: Math.round(price * 100000),
        station,
        location: "Modena",
        fullTank,
      },
    });
    await prisma.mileageRecord.create({ data: { vehicleId: vehicle.id, date, odometerKm, source: "RIFORNIMENTO" } });
  }

  const categoryRows = await prisma.expenseCategory.findMany();
  const categoryByName = Object.fromEntries(categoryRows.map((row) => [row.name, row.id]));
  const expenses = [
    [200, "assicurazione", "Premio RC auto", 486.3, "Unipol"],
    [185, "bollo", "Bollo annuale", 214.58, "ACI"],
    [160, "lavaggio", "Lavaggio completo", 18, "Autolavaggio"],
    [150, "pedaggio", "Autostrada A1", 23.4, "Telepass"],
    [132, "parcheggio", "Parcheggio centro", 7.5, "EasyPark"],
    [118, "accessori", "Supporto telefono", 19.9, "Amazon"],
    [96, "pedaggio", "Autostrada A22", 31.2, "Telepass"],
    [80, "pneumatici", "Convergenza", 45, "Gommista Rossi"],
    [63, "lavaggio", "Lavaggio rapido", 10, "Autolavaggio"],
    [49, "parcheggio", "Aeroporto", 54, "Parcheggio BLQ"],
    [38, "ricambi", "Spazzole tergicristallo", 27.8, "Autoricambi"],
    [30, "pedaggio", "Tangenziale", 8.1, "Telepass"],
    [21, "multa", "Sosta", 29.4, "Comune"],
    [14, "accessori", "Liquido vetri", 6.5, "Bricocenter"],
    [3, "lavaggio", "Lavaggio interno", 24, "Detailing"],
  ] as const;

  for (const [days, category, description, amount, supplier] of expenses) {
    await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        categoryId: categoryByName[category],
        date: subDays(new Date(), days),
        description,
        amountCents: Math.round(amount * 100),
        supplier,
      },
    });
  }

  for (const [days, odometerKm, type, description, cost] of [
    [190, 19020, "tagliando", "Tagliando annuale", 245],
    [155, 19840, "filtro abitacolo", "Sostituzione filtro abitacolo", 42],
    [120, 20520, "pneumatici", "Inversione pneumatici", 35],
    [70, 21480, "pastiglie freni", "Controllo impianto frenante", 88],
    [18, 22780, "batteria", "Test batteria e ricarica", 30],
  ] as const) {
    await prisma.maintenance.create({
      data: {
        vehicleId: vehicle.id,
        date: subDays(new Date(), days),
        odometerKm,
        type,
        description,
        workshop: "Officina Verdi",
        costCents: cost * 100,
        nextDueDate: addDays(new Date(), 365),
        nextDueMileageKm: odometerKm + 15000,
      },
    });
  }

  for (const [title, days, dueMileageKm, expectedCents] of [
    ["Assicurazione", 45, null, 52000],
    ["Bollo", 80, null, 22000],
    ["Revisione", 120, null, 7900],
    ["Tagliando", 25, 34000, 26000],
    ["Cambio olio", 12, 30000, 11000],
  ] as const) {
    await prisma.reminder.create({
      data: {
        vehicleId: vehicle.id,
        title,
        dueDate: addDays(new Date(), days),
        dueMileageKm,
        periodicity: "ANNUALE",
        expectedCents,
        status: days <= 30 ? "PROSSIMA" : "FUTURA",
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());
