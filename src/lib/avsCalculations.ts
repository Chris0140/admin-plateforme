/**
 * AVS (Assurance Vieillesse et Survivants) Pension Calculations
 * Based on Echelle 44 2025 - Database-driven version
 * 
 * Source: avs_scale_44 table populated from AVS_Echelle_44_2025.pdf
 * 
 * This module queries the official AVS scale from the database to calculate:
 * - Old-age pensions (Rente de vieillesse)
 * - Disability pensions (Rente d'invalidité)
 * - Survivor pensions (Rente de survivants)
 * - Child pensions (Rente pour enfants)
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Detailed AVS calculation result
 */
export interface AVSCalculationResult {
  // Old-age pensions
  old_age_rent_monthly: number;
  old_age_rent_annual: number;
  
  // Disability pensions (adjustable by fraction)
  disability_rent_monthly: number;
  disability_rent_annual: number;
  disability_fraction: '1/1' | '3/4' | '1/2' | '1/4';
  
  // Survivor pensions
  widow_rent_monthly: number;
  widow_rent_annual: number;
  
  // Child pensions (per child)
  child_rent_monthly: number;
  child_rent_annual: number;
  orphan_rent_monthly: number;
  orphan_rent_annual: number;
  
  // Metadata
  income_used: number;
  scale_row_id: string;
  full_rent_fraction: number;
  years_contributed: number;
}

/**
 * Calculate all AVS pensions from the official Échelle 44 database
 * 
 * @param annualIncome - Average annual determining income (CHF)
 * @param yearsContributed - Years contributed to AVS (0-44)
 * @param disabilityFraction - Degree of disability (optional, default 1/1 = full)
 * @returns Complete AVS calculation results
 */
export async function calculateAVSFromScale(
  annualIncome: number,
  yearsContributed: number = 44,
  disabilityFraction: '1/1' | '3/4' | '1/2' | '1/4' = '1/1'
): Promise<AVSCalculationResult> {
  
  // 1. Validation
  if (!annualIncome || annualIncome <= 0) {
    throw new Error("Le revenu annuel doit être positif");
  }
  
  if (yearsContributed < 0 || yearsContributed > 44) {
    throw new Error("Les années cotisées doivent être entre 0 et 44");
  }
  
  // 2. Find appropriate scale row (first threshold >= income)
  const { data: scaleRow, error } = await supabase
    .from('avs_scale_44')
    .select('*')
    .gte('income_threshold', annualIncome)
    .order('income_threshold', { ascending: true })
    .limit(1)
    .single();
  
  if (error || !scaleRow) {
    throw new Error("Impossible de trouver la tranche de revenu dans l'échelle AVS");
  }
  
  // 3. Calculate pension coefficient (years contributed / 44)
  const fullRentFraction = Math.min(yearsContributed / 44, 1);
  
  // 4. Calculate old-age pensions
  const oldAgeRentMonthly = scaleRow.old_age_rent_full * fullRentFraction;
  const oldAgeRentAnnual = oldAgeRentMonthly * 12;
  
  // 5. Calculate disability pensions according to degree
  let disabilityRentMonthly: number;
  switch (disabilityFraction) {
    case '3/4':
      disabilityRentMonthly = scaleRow.disability_rent_3_4 * fullRentFraction;
      break;
    case '1/2':
      disabilityRentMonthly = scaleRow.disability_rent_1_2 * fullRentFraction;
      break;
    case '1/4':
      disabilityRentMonthly = scaleRow.disability_rent_1_4 * fullRentFraction;
      break;
    default:
      disabilityRentMonthly = scaleRow.old_age_rent_full * fullRentFraction;
  }
  const disabilityRentAnnual = disabilityRentMonthly * 12;
  
  // 6. Calculate survivor pensions
  const widowRentMonthly = scaleRow.widow_rent_full * fullRentFraction;
  const widowRentAnnual = widowRentMonthly * 12;
  
  // 7. Calculate child pensions (per child)
  const childRentMonthly = scaleRow.child_rent * fullRentFraction;
  const childRentAnnual = childRentMonthly * 12;
  
  const orphanRentMonthly = scaleRow.orphan_rent_60pct * fullRentFraction;
  const orphanRentAnnual = orphanRentMonthly * 12;
  
  return {
    old_age_rent_monthly: Math.round(oldAgeRentMonthly),
    old_age_rent_annual: Math.round(oldAgeRentAnnual),
    disability_rent_monthly: Math.round(disabilityRentMonthly),
    disability_rent_annual: Math.round(disabilityRentAnnual),
    disability_fraction: disabilityFraction,
    widow_rent_monthly: Math.round(widowRentMonthly),
    widow_rent_annual: Math.round(widowRentAnnual),
    child_rent_monthly: Math.round(childRentMonthly),
    child_rent_annual: Math.round(childRentAnnual),
    orphan_rent_monthly: Math.round(orphanRentMonthly),
    orphan_rent_annual: Math.round(orphanRentAnnual),
    income_used: annualIncome,
    scale_row_id: scaleRow.id,
    full_rent_fraction: fullRentFraction,
    years_contributed: yearsContributed,
  };
}

/**
 * Save or update AVS profile in the database
 * 
 * @param profileId - User's profile ID
 * @param annualIncome - Average annual determining income
 * @param yearsContributed - Years contributed to AVS
 */
export async function saveAVSProfile(
  profileId: string,
  annualIncome: number,
  yearsContributed: number
): Promise<void> {
  const hasGaps = yearsContributed < 44;
  const fullRentFraction = Math.min(yearsContributed / 44, 1);
  
  const { error } = await supabase
    .from('avs_profiles')
    .upsert({
      profile_id: profileId,
      years_contributed: yearsContributed,
      years_missing: 44 - yearsContributed,
      has_gaps: hasGaps,
      average_annual_income_determinant: annualIncome,
      scale_used: '44',
      full_rent_fraction: fullRentFraction,
      last_calculation_date: new Date().toISOString(),
    }, {
      onConflict: 'profile_id'
    });
  
  if (error) throw error;
}

/**
 * Load AVS profile from database
 * 
 * @param profileId - User's profile ID
 * @returns AVS profile data or null if not found
 */
export async function loadAVSProfile(profileId: string) {
  const { data, error } = await supabase
    .from('avs_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

/**
 * Calculate all AVS pensions with proper structure for UI components
 * 
 * @param annualIncome - Annual determining income in CHF
 * @param yearsContributed - Years contributed (default 44)
 * @returns Object containing all pension calculations in structured format
 */
export async function calculateAllAVSPensionsStructured(annualIncome: number, yearsContributed: number = 44) {
  const result = await calculateAVSFromScale(annualIncome, yearsContributed, '1/1');
  
  return {
    oldAge: {
      fullRent: {
        monthly: result.old_age_rent_monthly,
        annual: result.old_age_rent_annual,
      }
    },
    disability: {
      fullRent: {
        monthly: result.disability_rent_monthly,
        annual: result.disability_rent_annual,
      }
    },
    widow: {
      fullRent: {
        monthly: result.widow_rent_monthly,
        annual: result.widow_rent_annual,
      }
    },
    child: {
      monthly: result.child_rent_monthly,
      annual: result.child_rent_annual,
    }
  };
}

/**
 * Calculate all AVS pensions with number of children
 * Legacy function for backward compatibility
 * 
 * @param annualIncome - Annual determining income in CHF
 * @param numberOfChildren - Number of children (optional, default 0)
 * @returns Object containing all pension calculations
 */
export async function calculateAllAVSPensions(annualIncome: number, numberOfChildren: number = 0) {
  const result = await calculateAVSFromScale(annualIncome, 44, '1/1');
  
  return {
    rente_vieillesse_mensuelle: result.old_age_rent_monthly,
    rente_vieillesse_annuelle: result.old_age_rent_annual,
    rente_invalidite_mensuelle: result.disability_rent_monthly,
    rente_invalidite_annuelle: result.disability_rent_annual,
    avs_rente_enfant_mensuelle: result.child_rent_monthly * numberOfChildren,
    avs_rente_enfant_annuelle: result.child_rent_annual * numberOfChildren,
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
