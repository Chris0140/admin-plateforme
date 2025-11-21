/**
 * LPP (2nd Pillar) Calculations
 * Professional pension calculations for Switzerland
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LPPAccount = Database['public']['Tables']['lpp_accounts']['Row'];
type LPPAccountInsert = Database['public']['Tables']['lpp_accounts']['Insert'];

/**
 * Result of LPP retirement calculations
 */
export interface LPPRetirementResult {
  account_id: string;
  provider_name: string;
  
  // Current values
  current_savings: number;
  
  // Projected at 65
  projected_savings_65: number;
  monthly_rent_65: number;
  annual_rent_65: number;
  
  // Early retirement options (60-64)
  retirement_options: {
    age: number;
    annual_rent: number;
    monthly_rent: number;
  }[];
}

/**
 * Result of LPP disability calculations
 */
export interface LPPDisabilityResult {
  account_id: string;
  provider_name: string;
  
  disability_rent_annual: number;
  disability_rent_monthly: number;
  
  child_disability_rent_annual: number;
  child_disability_rent_monthly: number;
  
  waiting_period_days: number;
}

/**
 * Result of LPP death/survivor calculations
 */
export interface LPPDeathResult {
  account_id: string;
  provider_name: string;
  
  death_capital_total: number;
  
  widow_rent_annual: number;
  widow_rent_monthly: number;
  
  orphan_rent_annual: number;
  orphan_rent_monthly: number;
}

/**
 * Combined LPP analysis for a profile
 */
export interface LPPAnalysis {
  total_accounts: number;
  
  // Retirement
  total_current_savings: number;
  total_projected_savings_65: number;
  total_monthly_rent_65: number;
  total_annual_rent_65: number;
  
  // Disability
  total_disability_rent_monthly: number;
  total_disability_rent_annual: number;
  
  // Death
  total_death_capital: number;
  total_widow_rent_monthly: number;
  total_orphan_rent_monthly: number;
  
  accounts_details: LPPAccount[];
}

/**
 * Load all LPP accounts for a profile
 */
export async function loadLPPAccounts(profileId: string): Promise<LPPAccount[]> {
  const { data, error } = await supabase
    .from('lpp_accounts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Calculate retirement projections for a single LPP account
 */
export function calculateLPPRetirement(account: LPPAccount): LPPRetirementResult {
  const retirementOptions = [];
  
  // Build early retirement options (60-64)
  for (let age = 60; age <= 64; age++) {
    const fieldName = `projected_retirement_rent_at_${age}` as keyof LPPAccount;
    const annualRent = account[fieldName] as number || 0;
    
    if (annualRent > 0) {
      retirementOptions.push({
        age,
        annual_rent: annualRent,
        monthly_rent: Math.round(annualRent / 12)
      });
    }
  }
  
  return {
    account_id: account.id,
    provider_name: account.provider_name,
    current_savings: account.current_retirement_savings || 0,
    projected_savings_65: account.projected_savings_at_65 || 0,
    annual_rent_65: account.projected_retirement_rent_at_65 || 0,
    monthly_rent_65: Math.round((account.projected_retirement_rent_at_65 || 0) / 12),
    retirement_options: retirementOptions
  };
}

/**
 * Calculate disability coverage for a single LPP account
 */
export function calculateLPPDisability(account: LPPAccount): LPPDisabilityResult {
  return {
    account_id: account.id,
    provider_name: account.provider_name,
    disability_rent_annual: account.disability_rent_annual || 0,
    disability_rent_monthly: Math.round((account.disability_rent_annual || 0) / 12),
    child_disability_rent_annual: account.child_disability_rent_annual || 0,
    child_disability_rent_monthly: Math.round((account.child_disability_rent_annual || 0) / 12),
    waiting_period_days: account.waiting_period_days || 0
  };
}

/**
 * Calculate death/survivor coverage for a single LPP account
 */
export function calculateLPPDeath(account: LPPAccount): LPPDeathResult {
  const totalDeathCapital = (account.death_capital || 0) + (account.additional_death_capital || 0);
  
  return {
    account_id: account.id,
    provider_name: account.provider_name,
    death_capital_total: totalDeathCapital,
    widow_rent_annual: account.widow_rent_annual || 0,
    widow_rent_monthly: Math.round((account.widow_rent_annual || 0) / 12),
    orphan_rent_annual: account.orphan_rent_annual || 0,
    orphan_rent_monthly: Math.round((account.orphan_rent_annual || 0) / 12)
  };
}

/**
 * Aggregate LPP analysis across all accounts for a profile
 */
export async function calculateLPPAnalysis(profileId: string): Promise<LPPAnalysis> {
  const accounts = await loadLPPAccounts(profileId);
  
  if (accounts.length === 0) {
    return {
      total_accounts: 0,
      total_current_savings: 0,
      total_projected_savings_65: 0,
      total_monthly_rent_65: 0,
      total_annual_rent_65: 0,
      total_disability_rent_monthly: 0,
      total_disability_rent_annual: 0,
      total_death_capital: 0,
      total_widow_rent_monthly: 0,
      total_orphan_rent_monthly: 0,
      accounts_details: []
    };
  }
  
  // Aggregate all accounts
  const totals = accounts.reduce((acc, account) => {
    return {
      current_savings: acc.current_savings + (account.current_retirement_savings || 0),
      projected_savings_65: acc.projected_savings_65 + (account.projected_savings_at_65 || 0),
      annual_rent_65: acc.annual_rent_65 + (account.projected_retirement_rent_at_65 || 0),
      disability_annual: acc.disability_annual + (account.disability_rent_annual || 0),
      death_capital: acc.death_capital + (account.death_capital || 0) + (account.additional_death_capital || 0),
      widow_annual: acc.widow_annual + (account.widow_rent_annual || 0),
      orphan_annual: acc.orphan_annual + (account.orphan_rent_annual || 0)
    };
  }, {
    current_savings: 0,
    projected_savings_65: 0,
    annual_rent_65: 0,
    disability_annual: 0,
    death_capital: 0,
    widow_annual: 0,
    orphan_annual: 0
  });
  
  return {
    total_accounts: accounts.length,
    total_current_savings: totals.current_savings,
    total_projected_savings_65: totals.projected_savings_65,
    total_annual_rent_65: totals.annual_rent_65,
    total_monthly_rent_65: Math.round(totals.annual_rent_65 / 12),
    total_disability_rent_annual: totals.disability_annual,
    total_disability_rent_monthly: Math.round(totals.disability_annual / 12),
    total_death_capital: totals.death_capital,
    total_widow_rent_monthly: Math.round(totals.widow_annual / 12),
    total_orphan_rent_monthly: Math.round(totals.orphan_annual / 12),
    accounts_details: accounts
  };
}

/**
 * Save or update an LPP account
 */
export async function saveLPPAccount(account: LPPAccountInsert): Promise<string> {
  const { data, error } = await supabase
    .from('lpp_accounts')
    .upsert(account)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

/**
 * Delete an LPP account
 */
export async function deleteLPPAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('lpp_accounts')
    .delete()
    .eq('id', accountId);
  
  if (error) throw error;
}

/**
 * Format currency value for display
 */
export function formatCHF(value: number): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' CHF';
}
