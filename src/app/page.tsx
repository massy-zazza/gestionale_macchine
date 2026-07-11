import { prisma } from "@/lib/prisma";
import { buildConsumptionIntervals, weightedKmPerLiter } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [vehicles, refuels, expenses, maintenances, reminders] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.refuel.findMany({ orderBy: { date: "asc" } }),
    prisma.expense.findMany({ include: { category: true } }),
    prisma.maintenance.findMany(),
    prisma.reminder.findMany({ orderBy: { dueDate: "asc" } }),
  ]);
  const intervals = buildConsumptionIntervals(refuels);
  const kmL = weightedKmPerLiter(intervals.filter((row) => !row.isEstimate).map((row) => ({ km: row.km, liters: row.liters })));
  const total = refuels.reduce((s, r) => s + r.totalCents, 0) + expenses.reduce((s, e) => s + e.amountCents, 0) + maintenances.reduce((s, m) => s + m.costCents, 0);
  const fuel = refuels.reduce((s, r) => s + r.totalCents, 0);
  const latestKm = Math.max(0, ...refuels.map((r) => r.odometerKm));
  return (
    <div className="grid gap-5">
      <header>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-[color:var(--muted)]">Auto attiva: {vehicles[0] ? `${vehicles[0].make} ${vehicles[0].model}` : "nessuna"}</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric title="Spesa totale" value={formatCurrency(total)} />
        <Metric title="Carburante" value={formatCurrency(fuel)} />
        <Metric title="Consumo medio" value={`${formatNumber(kmL)} km/l`} />
        <Metric title="l/100 km" value={kmL ? formatNumber(100 / kmL) : "0,0"} />
        <Metric title="Ultimo km" value={`${formatNumber(latestKm, 0)} km`} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-bold">Spese recenti</h3>
          <ul className="grid gap-2 text-sm">
            {expenses.slice(0, 8).map((expense) => (
              <li key={expense.id} className="flex justify-between border-b border-[color:var(--line)] pb-2">
                <span>{expense.description}</span>
                <strong>{formatCurrency(expense.amountCents)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-3 font-bold">Prossime scadenze</h3>
          <ul className="grid gap-2 text-sm">
            {reminders.slice(0, 8).map((reminder) => (
              <li key={reminder.id} className="flex justify-between border-b border-[color:var(--line)] pb-2">
                <span>{reminder.title}</span>
                <strong>{new Intl.DateTimeFormat("it-IT").format(reminder.dueDate)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs font-bold uppercase text-[color:var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
