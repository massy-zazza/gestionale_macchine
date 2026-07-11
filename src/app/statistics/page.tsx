import { prisma } from "@/lib/prisma";
import { buildConsumptionIntervals, weightedKmPerLiter } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [refuels, expenses] = await Promise.all([prisma.refuel.findMany(), prisma.expense.findMany()]);
  const intervals = buildConsumptionIntervals(refuels);
  return (
    <div>
      <h2 className="mb-5 text-3xl font-bold">Statistiche</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card"><strong>Consumo medio</strong><p>{formatNumber(weightedKmPerLiter(intervals.map((i) => ({ km: i.km, liters: i.liters }))))} km/l</p></div>
        <div className="card"><strong>Spese registrate</strong><p>{expenses.length}</p></div>
        <div className="card"><strong>Carburante</strong><p>{formatCurrency(refuels.reduce((s, r) => s + r.totalCents, 0))}</p></div>
      </div>
    </div>
  );
}
