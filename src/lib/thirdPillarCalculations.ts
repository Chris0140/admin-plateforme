import { supabase } from "@/integrations/supabase/client";

export interface ThirdPillarAccount {
  id: string;
  profile_id: string;
  account_type: '3a_bank' | '3a_insurance' | '3b';
  institution_name: string;
  contract_number?: string;
  current_amount: number;
  annual_contribution: number;
  start_date?: string;
  return_rate: number;
  projected_amount_at_retirement?: number;
  projected_annual_rent?: number;
  is_active: boolean;
  notes?: string;
}

export interface ThirdPillarProjection {
  accountId: string;
  institutionName: string;
  accountType: string;
  currentAmount: number;
  annualContribution: number;
  yearsToRetirement: number;
  returnRate: number;
  projectedAmount: number;
  projectedAnnualRent: number;
}

export interface ThirdPillarAnalysis {
  totalCurrentAmount: number;
  totalAnnualContribution: number;
  totalProjectedAmount: number;
  totalProjectedAnnualRent: number;
  accounts: ThirdPillarProjection[];
}

/**
 * Load all third pillar accounts for a profile
 */
export async function loadThirdPillarAccounts(profileId: string): Promise<ThirdPillarAccount[]> {
  const { data, error } = await supabase
    .from('third_pillar_accounts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading third pillar accounts:', error);
    return [];
  }

  return (data || []) as ThirdPillarAccount[];
}

/**
 * Calculate projection for a single third pillar account
 */
export function calculateThirdPillarProjection(
  account: ThirdPillarAccount,
  currentAge: number,
  retirementAge: number = 65
): ThirdPillarProjection {
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const returnRate = account.return_rate / 100;

  // Calculate future value with compound interest and annual contributions
  let projectedAmount = account.current_amount;
  
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedAmount = projectedAmount * (1 + returnRate) + account.annual_contribution;
  }

  // Calculate annual rent (capital divided by 20 years)
  const projectedAnnualRent = projectedAmount / 20;

  return {
    accountId: account.id,
    institutionName: account.institution_name,
    accountType: account.account_type,
    currentAmount: account.current_amount,
    annualContribution: account.annual_contribution,
    yearsToRetirement,
    returnRate: account.return_rate,
    projectedAmount,
    projectedAnnualRent,
  };
}

/**
 * Calculate comprehensive third pillar analysis
 */
export async function calculateThirdPillarAnalysis(
  profileId: string,
  dateOfBirth: string
): Promise<ThirdPillarAnalysis> {
  const accounts = await loadThirdPillarAccounts(profileId);
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const currentAge = today.getFullYear() - birthDate.getFullYear();

  const projections = accounts.map(account => 
    calculateThirdPillarProjection(account, currentAge)
  );

  const totalCurrentAmount = projections.reduce((sum, p) => sum + p.currentAmount, 0);
  const totalAnnualContribution = projections.reduce((sum, p) => sum + p.annualContribution, 0);
  const totalProjectedAmount = projections.reduce((sum, p) => sum + p.projectedAmount, 0);
  const totalProjectedAnnualRent = projections.reduce((sum, p) => sum + p.projectedAnnualRent, 0);

  return {
    totalCurrentAmount,
    totalAnnualContribution,
    totalProjectedAmount,
    totalProjectedAnnualRent,
    accounts: projections,
  };
}

/**
 * Save or update a third pillar account
 */
export async function saveThirdPillarAccount(
  account: Partial<ThirdPillarAccount>
): Promise<{ success: boolean; error?: string; data?: ThirdPillarAccount }> {
  try {
    if (account.id) {
      // Update existing account
      const { data, error } = await supabase
        .from('third_pillar_accounts')
        .update(account)
        .eq('id', account.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as ThirdPillarAccount };
    } else {
      // Insert new account
      const { data, error } = await supabase
        .from('third_pillar_accounts')
        .insert([account as any])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as ThirdPillarAccount };
    }
  } catch (error: any) {
    console.error('Error saving third pillar account:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a third pillar account
 */
export async function deleteThirdPillarAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('third_pillar_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting third pillar account:', error);
    return { success: false, error: error.message };
  }
}