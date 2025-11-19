/**
 * AVS (Assurance Vieillesse et Survivants) Pension Calculations
 * Based on Echelle 44 2025
 * 
 * Source: AVS_Echelle_44_2025.pdf
 * 
 * This scale is used to calculate monthly pensions for:
 * - Old-age pensions (Rente de vieillesse)
 * - Disability pensions (Rente d'invalidité)
 * 
 * Important notes:
 * - These are complete pension amounts (full contribution period)
 * - Actual pensions may vary based on contribution years, splitting, etc.
 * - Users should be able to manually adjust calculated values
 */

// Echelle 44 2025 - Mapping of annual income to monthly pension
// Format: [maxIncome, monthlyPension]
const ECHELLE_44_2025: [number, number][] = [
  [15120, 1260],
  [16800, 1285],
  [18480, 1310],
  [20160, 1335],
  [21840, 1360],
  [23520, 1385],
  [25200, 1410],
  [26880, 1435],
  [28560, 1460],
  [30240, 1485],
  [31920, 1510],
  [33600, 1535],
  [35280, 1560],
  [36960, 1585],
  [38640, 1610],
  [40320, 1635],
  [42000, 1660],
  [43680, 1685],
  [45360, 1710],
  [47040, 1735],
  [48720, 1760],
  [50400, 1785],
  [52080, 1810],
  [53760, 1835],
  [55440, 1860],
  [57120, 1885],
  [58800, 1910],
  [60480, 1935],
  [62160, 1960],
  [63840, 1985],
  [65520, 2010],
  [67200, 2035],
  [68880, 2060],
  [70560, 2085],
  [72240, 2110],
  [73920, 2135],
  [75600, 2160],
  [77280, 2185],
  [78960, 2210],
  [80640, 2235],
  [82320, 2260],
  [84000, 2285],
  [85680, 2310],
  [87360, 2335],
  [89040, 2360],
  [90720, 2520], // Maximum pension at 90,720 CHF or more
];

const MIN_PENSION = 1260; // CHF per month
const MAX_PENSION = 2520; // CHF per month
const MIN_INCOME = 15120; // CHF per year
const MAX_INCOME = 90720; // CHF per year

/**
 * Calculate monthly AVS pension based on annual income
 * Uses Echelle 44 2025
 * 
 * @param annualIncome - Annual determining income in CHF
 * @returns Monthly pension amount in CHF
 */
export function calculateAVSPension(annualIncome: number): number {
  // Handle edge cases
  if (!annualIncome || annualIncome <= 0) {
    return 0;
  }

  // Minimum pension for income at or below minimum threshold
  if (annualIncome <= MIN_INCOME) {
    return MIN_PENSION;
  }

  // Maximum pension for income at or above maximum threshold
  if (annualIncome >= MAX_INCOME) {
    return MAX_PENSION;
  }

  // Find the appropriate bracket in the scale
  for (const [maxIncome, monthlyPension] of ECHELLE_44_2025) {
    if (annualIncome <= maxIncome) {
      return monthlyPension;
    }
  }

  // Fallback to maximum pension (should not reach here)
  return MAX_PENSION;
}

/**
 * Calculate all AVS pension values (monthly and annual, old-age and disability)
 * 
 * @param annualIncome - Annual determining income in CHF
 * @returns Object containing all pension calculations
 */
export function calculateAllAVSPensions(annualIncome: number) {
  const monthlyPension = calculateAVSPension(annualIncome);
  const annualPension = monthlyPension * 12;

  return {
    rente_vieillesse_mensuelle: monthlyPension,
    rente_vieillesse_annuelle: annualPension,
    rente_invalidite_mensuelle: monthlyPension, // Same as old-age for AVS
    rente_invalidite_annuelle: annualPension,
    revenu_annuel_determinant: annualIncome,
  };
}

/**
 * Format currency value for display
 * 
 * @param value - Numeric value
 * @returns Formatted string with CHF suffix
 */
export function formatCHF(value: number): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' CHF';
}
