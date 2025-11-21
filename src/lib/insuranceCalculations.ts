import { supabase } from "@/integrations/supabase/client";

export interface InsuranceContract {
  id: string;
  profile_id: string;
  insurance_type: 'health_basic' | 'health_complementary' | 'household' | 'liability' | 'vehicle' | 'legal_protection' | 'life' | 'disability' | 'loss_of_earnings';
  company_name: string;
  contract_number?: string;
  annual_premium: number;
  deductible?: number;
  coverage_amount?: number;
  disability_rent_annual?: number;
  death_capital?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
}

export interface InsuranceAnalysis {
  totalAnnualPremium: number;
  totalDeathCapital: number;
  totalDisabilityRent: number;
  byType: {
    health: { count: number; premium: number };
    protection: { count: number; premium: number };
    property: { count: number; premium: number };
  };
  contracts: InsuranceContract[];
}

export const INSURANCE_TYPE_LABELS: Record<InsuranceContract['insurance_type'], string> = {
  health_basic: 'Assurance maladie de base (LAMal)',
  health_complementary: 'Assurance complémentaire (LCA)',
  household: 'Assurance ménage',
  liability: 'Responsabilité civile',
  vehicle: 'Assurance véhicule',
  legal_protection: 'Protection juridique',
  life: 'Assurance vie',
  disability: 'Assurance invalidité',
  loss_of_earnings: 'Perte de gain',
};

/**
 * Load all insurance contracts for a profile
 */
export async function loadInsuranceContracts(profileId: string): Promise<InsuranceContract[]> {
  const { data, error } = await supabase
    .from('insurance_contracts')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('insurance_type', { ascending: true });

  if (error) {
    console.error('Error loading insurance contracts:', error);
    return [];
  }

  return (data || []) as InsuranceContract[];
}

/**
 * Calculate comprehensive insurance analysis
 */
export async function calculateInsuranceAnalysis(profileId: string): Promise<InsuranceAnalysis> {
  const contracts = await loadInsuranceContracts(profileId);

  const totalAnnualPremium = contracts.reduce((sum, c) => sum + (c.annual_premium || 0), 0);
  const totalDeathCapital = contracts.reduce((sum, c) => sum + (c.death_capital || 0), 0);
  const totalDisabilityRent = contracts.reduce((sum, c) => sum + (c.disability_rent_annual || 0), 0);

  const healthTypes: InsuranceContract['insurance_type'][] = ['health_basic', 'health_complementary'];
  const protectionTypes: InsuranceContract['insurance_type'][] = ['life', 'disability', 'loss_of_earnings'];
  const propertyTypes: InsuranceContract['insurance_type'][] = ['household', 'liability', 'vehicle', 'legal_protection'];

  const byType = {
    health: {
      count: contracts.filter(c => healthTypes.includes(c.insurance_type)).length,
      premium: contracts.filter(c => healthTypes.includes(c.insurance_type)).reduce((sum, c) => sum + c.annual_premium, 0),
    },
    protection: {
      count: contracts.filter(c => protectionTypes.includes(c.insurance_type)).length,
      premium: contracts.filter(c => protectionTypes.includes(c.insurance_type)).reduce((sum, c) => sum + c.annual_premium, 0),
    },
    property: {
      count: contracts.filter(c => propertyTypes.includes(c.insurance_type)).length,
      premium: contracts.filter(c => propertyTypes.includes(c.insurance_type)).reduce((sum, c) => sum + c.annual_premium, 0),
    },
  };

  return {
    totalAnnualPremium,
    totalDeathCapital,
    totalDisabilityRent,
    byType,
    contracts,
  };
}

/**
 * Save or update an insurance contract
 */
export async function saveInsuranceContract(
  contract: Partial<InsuranceContract>
): Promise<{ success: boolean; error?: string; data?: InsuranceContract }> {
  try {
    if (contract.id) {
      // Update existing contract
      const { data, error } = await supabase
        .from('insurance_contracts')
        .update(contract)
        .eq('id', contract.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as InsuranceContract };
    } else {
      // Insert new contract
      const { data, error } = await supabase
        .from('insurance_contracts')
        .insert([contract as any])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as InsuranceContract };
    }
  } catch (error: any) {
    console.error('Error saving insurance contract:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an insurance contract
 */
export async function deleteInsuranceContract(contractId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('insurance_contracts')
      .delete()
      .eq('id', contractId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting insurance contract:', error);
    return { success: false, error: error.message };
  }
}