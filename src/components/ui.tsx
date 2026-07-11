export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      {description ? <p className="text-[color:var(--muted)]">{description}</p> : null}
    </header>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3 className="mb-3 font-bold">{title}</h3>
      {children}
    </section>
  );
}
