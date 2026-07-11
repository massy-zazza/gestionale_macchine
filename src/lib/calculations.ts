export function kmPerLiter(km: number, liters: number) {
  if (km <= 0 || liters <= 0) return 0;
  return km / liters;
}

export function litersPer100Km(km: number, liters: number) {
  if (km <= 0 || liters <= 0) return 0;
  return (liters / km) * 100;
}

export function costPerKm(totalCents: number, km: number) {
  if (km <= 0 || totalCents <= 0) return 0;
  return totalCents / 100 / km;
}

export function weightedKmPerLiter(rows: Array<{ km: number; liters: number }>) {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.km > 0 && row.liters > 0) {
        acc.km += row.km;
        acc.liters += row.liters;
      }
      return acc;
    },
    { km: 0, liters: 0 },
  );
  return kmPerLiter(totals.km, totals.liters);
}

export function validateMileage(newOdometerKm: number, lastOdometerKm: number) {
  return newOdometerKm < lastOdometerKm ? "Il chilometraggio è inferiore all'ultima rilevazione" : null;
}

export function buildConsumptionIntervals(
  refuels: Array<{ odometerKm: number; litersMl: number; totalCents: number; fullTank: boolean; date: Date }>,
) {
  const sorted = [...refuels].sort((a, b) => a.odometerKm - b.odometerKm);
  const intervals: Array<{ date: Date; km: number; liters: number; kmPerLiter: number; litersPer100Km: number; costPerKm: number; isEstimate: boolean }> = [];
  let previousFull: (typeof sorted)[number] | null = null;
  for (const refuel of sorted) {
    if (!previousFull) {
      if (refuel.fullTank) previousFull = refuel;
      continue;
    }
    const km = refuel.odometerKm - previousFull.odometerKm;
    const liters = refuel.litersMl / 1000;
    if (km > 0 && liters > 0) {
      intervals.push({
        date: refuel.date,
        km,
        liters,
        kmPerLiter: kmPerLiter(km, liters),
        litersPer100Km: litersPer100Km(km, liters),
        costPerKm: costPerKm(refuel.totalCents, km),
        isEstimate: !refuel.fullTank,
      });
    }
    if (refuel.fullTank) previousFull = refuel;
  }
  return intervals;
}
