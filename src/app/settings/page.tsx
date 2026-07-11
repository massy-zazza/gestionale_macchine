import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const vehicles = await prisma.vehicle.findMany();
  const categories = await prisma.expenseCategory.findMany();
  return <div><h2 className="mb-5 text-3xl font-bold">Impostazioni</h2><div className="grid gap-4 lg:grid-cols-2"><div className="card"><h3 className="font-bold">Veicoli</h3>{vehicles.map((v) => <p key={v.id}>{v.make} {v.model}</p>)}</div><div className="card"><h3 className="font-bold">Categorie</h3>{categories.map((c) => <p key={c.id}>{c.name}</p>)}</div></div></div>;
}
