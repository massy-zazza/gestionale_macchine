import { describe, expect, it } from "vitest";
import { buildConsumptionIntervals, costPerKm, kmPerLiter, litersPer100Km, validateMileage, weightedKmPerLiter } from "@/lib/calculations";

describe("calcoli consumi auto", () => {
  it("calcola km/l", () => expect(kmPerLiter(600, 40)).toBe(15));
  it("calcola l/100 km", () => expect(litersPer100Km(600, 40)).toBeCloseTo(6.666, 2));
  it("calcola costo per chilometro", () => expect(costPerKm(7200, 600)).toBeCloseTo(0.12, 2));
  it("usa media ponderata", () => expect(weightedKmPerLiter([{ km: 100, liters: 10 }, { km: 900, liters: 45 }])).toBeCloseTo(18.18, 2));
  it("valida chilometraggio", () => expect(validateMileage(1200, 1300)).toBe("Il chilometraggio è inferiore all'ultima rilevazione"));
  it("calcola intervalli", () => {
    const intervals = buildConsumptionIntervals([
      { date: new Date("2026-01-01"), odometerKm: 1000, litersMl: 40000, totalCents: 7200, fullTank: true },
      { date: new Date("2026-01-20"), odometerKm: 1600, litersMl: 39000, totalCents: 7000, fullTank: true },
    ]);
    expect(intervals[0].kmPerLiter).toBeCloseTo(15.38, 2);
  });
});
