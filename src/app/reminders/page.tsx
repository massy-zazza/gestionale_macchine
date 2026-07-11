import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const rows = await prisma.reminder.findMany({ orderBy: { dueDate: "asc" } });
  return <div><h2 className="mb-5 text-3xl font-bold">Scadenze</h2><div className="grid gap-3">{rows.map((row) => <div className="card" key={row.id}><strong>{row.title}</strong><p>{new Intl.DateTimeFormat("it-IT").format(row.dueDate)} - {row.status}</p></div>)}</div></div>;
}
