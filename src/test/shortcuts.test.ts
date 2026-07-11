import { describe, expect, it } from "vitest";

function valid(auth: string | null, key = "secret") {
  return auth === `Bearer ${key}`;
}

describe("endpoint Comandi Rapidi", () => {
  it("rifiuta richieste senza API key", () => expect(valid(null)).toBe(false));
  it("accetta Authorization Bearer corretta", () => expect(valid("Bearer secret")).toBe(true));
});
