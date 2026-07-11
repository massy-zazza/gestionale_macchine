import { NextResponse } from "next/server";

const templates: Record<string, string> = {
  refuels: "data,chilometraggio,litri,importo,prezzo_al_litro,pieno_completo,distributore,note\n",
  expenses: "data,categoria,descrizione,importo,chilometraggio,fornitore,note\n",
  maintenance: "data,chilometraggio,tipo,descrizione,officina,costo,note\n",
};

export async function GET(_request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  return new NextResponse(templates[kind] ?? templates.expenses, {
    headers: { "content-type": "text/csv; charset=utf-8" },
  });
}
