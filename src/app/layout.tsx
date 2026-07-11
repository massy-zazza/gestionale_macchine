import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestionale Macchine",
  description: "Spese, consumi e manutenzioni auto.",
};

const nav = [
  ["/", "Dashboard"],
  ["/refuels", "Rifornimenti"],
  ["/expenses", "Spese"],
  ["/maintenance", "Manutenzioni"],
  ["/statistics", "Statistiche"],
  ["/reminders", "Scadenze"],
  ["/settings", "Impostazioni"],
  ["/shortcuts", "Comandi Rapidi"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen md:flex">
          <aside className="border-r border-[color:var(--line)] bg-[color:var(--card)] p-4 md:min-h-screen md:w-72">
            <h1 className="mb-4 text-xl font-bold">Gestionale Macchine</h1>
            <nav className="grid gap-1">
              {nav.map(([href, label]) => (
                <Link key={href} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-black/5" href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
