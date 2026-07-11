import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RefuelsPage() {
  const refuels = await prisma.refuel.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } });
  return (
    <Page title="Rifornimenti">
      <Table rows={refuels.map((r) => [new Intl.DateTimeFormat("it-IT").format(r.date), `${formatNumber(r.odometerKm, 0)} km`, `${formatNumber(r.litersMl / 1000, 2)} l`, formatCurrency(r.totalCents), r.station || "-"])} />
    </Page>
  );
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-5 text-3xl font-bold">{title}</h2>{children}</div>;
}

function Table({ rows }: { rows: string[][] }) {
  return <div className="card overflow-auto"><table className="w-full text-left text-sm"><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td className="border-b border-[color:var(--line)] p-3" key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
