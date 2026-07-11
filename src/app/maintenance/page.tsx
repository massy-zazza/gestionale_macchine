import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const rows = await prisma.maintenance.findMany({ orderBy: { date: "desc" } });
  return (
    <div>
      <h2 className="mb-5 text-3xl font-bold">Manutenzioni</h2>
      <div className="grid gap-3">{rows.map((row) => <div key={row.id} className="card"><strong>{row.type}</strong><p>{row.description}</p><p className="text-sm text-[color:var(--muted)]">{formatNumber(row.odometerKm, 0)} km - {formatCurrency(row.costCents)}</p></div>)}</div>
    </div>
  );
}
