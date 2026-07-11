"use client";

export function CopyButton({ text, label = "Copia" }: { text: string; label?: string }) {
  return <button className="btn" onClick={() => navigator.clipboard.writeText(text)}>{label}</button>;
}
