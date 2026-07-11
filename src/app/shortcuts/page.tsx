export const dynamic = "force-dynamic";

export default function ShortcutsPage() {
  return (
    <div>
      <h2 className="mb-5 text-3xl font-bold">Comandi Rapidi iPhone</h2>
      <div className="card">
        <p className="mb-3">Endpoint protetti da header Authorization: Bearer SHORTCUTS_API_KEY.</p>
        <pre className="overflow-auto rounded bg-black p-4 text-sm text-white">{`POST /api/shortcuts/refuel
POST /api/shortcuts/expense
POST /api/shortcuts/mileage
GET  /api/shortcuts/summary`}</pre>
      </div>
    </div>
  );
}
