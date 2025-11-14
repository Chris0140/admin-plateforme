// Barèmes officiels 2025 pour le canton de Vaud

// Barème de l'impôt sur le revenu - simplifié avec les principaux paliers
export const baremeRevenuVD2025: Array<{ revenu: number; impot: number }> = [
  { revenu: 100, impot: 1.00 }, { revenu: 500, impot: 5.00 }, { revenu: 1000, impot: 10.00 },
  { revenu: 1700, impot: 18.00 }, { revenu: 2000, impot: 24.00 }, { revenu: 2500, impot: 34.00 },
  { revenu: 3000, impot: 44.00 }, { revenu: 3500, impot: 55.00 }, { revenu: 4000, impot: 70.00 },
  { revenu: 4500, impot: 85.00 }, { revenu: 5000, impot: 99.00 }, { revenu: 6000, impot: 139.00 },
  { revenu: 7000, impot: 179.00 }, { revenu: 8000, impot: 219.00 }, { revenu: 9000, impot: 266.00 },
  { revenu: 10000, impot: 313.00 }, { revenu: 11000, impot: 360.00 }, { revenu: 12000, impot: 407.00 },
  { revenu: 13000, impot: 454.00 }, { revenu: 14000, impot: 505.00 }, { revenu: 15000, impot: 556.00 },
  { revenu: 16000, impot: 607.00 }, { revenu: 17000, impot: 658.00 }, { revenu: 18000, impot: 713.00 },
  { revenu: 19000, impot: 768.00 }, { revenu: 20000, impot: 823.00 }, { revenu: 22000, impot: 943.00 },
  { revenu: 25000, impot: 1120.00 }, { revenu: 30000, impot: 1466.00 }, { revenu: 35000, impot: 1849.00 },
  { revenu: 40000, impot: 2269.00 }, { revenu: 45000, impot: 2726.00 }, { revenu: 50000, impot: 3220.00 },
  { revenu: 55000, impot: 3751.00 }, { revenu: 60000, impot: 4294.00 }, { revenu: 70000, impot: 5488.00 },
  { revenu: 80000, impot: 6802.00 }, { revenu: 90000, impot: 8236.00 }, { revenu: 100000, impot: 9790.00 },
  { revenu: 110000, impot: 11464.00 }, { revenu: 120000, impot: 13168.00 }, { revenu: 130000, impot: 14992.00 },
  { revenu: 140000, impot: 17056.00 }, { revenu: 150000, impot: 19140.00 }, { revenu: 160000, impot: 21454.00 },
  { revenu: 180000, impot: 26362.00 }, { revenu: 200000, impot: 31780.00 }, { revenu: 250000, impot: 46530.00 },
  { revenu: 300000, impot: 63030.00 }, { revenu: 400000, impot: 100530.00 }, { revenu: 500000, impot: 143030.00 }
];

// Barème de l'impôt sur la fortune
export const baremeFortuneVD2025: Array<{ fortune: number; impot: number }> = [
  { fortune: 50000, impot: 22.95 }, { fortune: 55000, impot: 27.80 }, { fortune: 60000, impot: 32.65 },
  { fortune: 65000, impot: 37.50 }, { fortune: 70000, impot: 42.35 }, { fortune: 75000, impot: 47.20 },
  { fortune: 80000, impot: 52.05 }, { fortune: 85000, impot: 56.90 }, { fortune: 90000, impot: 61.75 },
  { fortune: 95000, impot: 66.60 }, { fortune: 100000, impot: 75.05 }, { fortune: 110000, impot: 91.95 },
  { fortune: 120000, impot: 108.85 }, { fortune: 130000, impot: 125.75 }, { fortune: 140000, impot: 142.65 },
  { fortune: 150000, impot: 163.55 }, { fortune: 160000, impot: 180.45 }, { fortune: 170000, impot: 197.35 },
  { fortune: 180000, impot: 218.25 }, { fortune: 190000, impot: 239.15 }, { fortune: 200000, impot: 260.05 },
  { fortune: 220000, impot: 301.85 }, { fortune: 250000, impot: 364.80 }, { fortune: 300000, impot: 479.55 },
  { fortune: 350000, impot: 594.30 }, { fortune: 400000, impot: 724.05 }, { fortune: 450000, impot: 853.80 },
  { fortune: 500000, impot: 983.55 }, { fortune: 600000, impot: 1258.05 }, { fortune: 700000, impot: 1547.55 },
  { fortune: 800000, impot: 1852.05 }, { fortune: 900000, impot: 2171.55 }, { fortune: 1000000, impot: 2506.05 },
  { fortune: 1200000, impot: 3219.05 }, { fortune: 1500000, impot: 4217.55 }, { fortune: 2000000, impot: 5925.05 }
];

// Interpolation linéaire pour les valeurs entre les paliers
export function interpolateFromTable(
  value: number,
  table: Array<{ revenu?: number; fortune?: number; impot: number }>
): number {
  if (value <= 0) return 0;

  const key = 'revenu' in table[0] ? 'revenu' : 'fortune';
  const sorted = table.sort((a, b) => (a[key] as number) - (b[key] as number));

  // Si la valeur est inférieure au premier palier
  if (value <= (sorted[0][key] as number)) {
    const rate = sorted[0].impot / (sorted[0][key] as number);
    return value * rate;
  }

  // Si la valeur est supérieure au dernier palier, extrapolation linéaire
  if (value >= (sorted[sorted.length - 1][key] as number)) {
    const last = sorted[sorted.length - 1];
    const beforeLast = sorted[sorted.length - 2];
    const increment = (last.impot - beforeLast.impot) / ((last[key] as number) - (beforeLast[key] as number));
    return last.impot + (value - (last[key] as number)) * increment;
  }

  // Interpolation entre deux paliers
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (value >= (current[key] as number) && value <= (next[key] as number)) {
      const ratio = (value - (current[key] as number)) / ((next[key] as number) - (current[key] as number));
      return current.impot + ratio * (next.impot - current.impot);
    }
  }

  return 0;
}

export function calculateVaudIncomeTax(revenu: number): number {
  return interpolateFromTable(revenu, baremeRevenuVD2025);
}

export function calculateVaudWealthTax(fortune: number): number {
  if (fortune < 50000) return 0; // Franchise de 50'000 CHF
  return interpolateFromTable(fortune, baremeFortuneVD2025);
}
