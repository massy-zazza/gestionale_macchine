import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({ include: { category: true }, orderBy: { date: "desc" } });
  return (
    <div>
      <h2 className="mb-5 text-3xl font-bold">Spese</h2>
      <div className="card overflow-auto">
        <table className="w-full text-left text-sm"><tbody>{expenses.map((e) => <tr key={e.id}><td className="border-b p-3">{new Intl.DateTimeFormat("it-IT").format(e.date)}</td><td className="border-b p-3">{e.category.name}</td><td className="border-b p-3">{e.description}</td><td className="border-b p-3 font-bold">{formatCurrency(e.amountCents)}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
