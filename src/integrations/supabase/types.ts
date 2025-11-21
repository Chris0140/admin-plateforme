export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      avs_profiles: {
        Row: {
          average_annual_income_determinant: number | null
          avs_number: string | null
          created_at: string | null
          full_rent_fraction: number | null
          has_gaps: boolean | null
          id: string
          is_active: boolean | null
          last_calculation_date: string | null
          marital_status: string | null
          owner_name: string | null
          profile_id: string
          scale_used: string | null
          updated_at: string | null
          years_contributed: number | null
          years_missing: number | null
        }
        Insert: {
          average_annual_income_determinant?: number | null
          avs_number?: string | null
          created_at?: string | null
          full_rent_fraction?: number | null
          has_gaps?: boolean | null
          id?: string
          is_active?: boolean | null
          last_calculation_date?: string | null
          marital_status?: string | null
          owner_name?: string | null
          profile_id: string
          scale_used?: string | null
          updated_at?: string | null
          years_contributed?: number | null
          years_missing?: number | null
        }
        Update: {
          average_annual_income_determinant?: number | null
          avs_number?: string | null
          created_at?: string | null
          full_rent_fraction?: number | null
          has_gaps?: boolean | null
          id?: string
          is_active?: boolean | null
          last_calculation_date?: string | null
          marital_status?: string | null
          owner_name?: string | null
          profile_id?: string
          scale_used?: string | null
          updated_at?: string | null
          years_contributed?: number | null
          years_missing?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avs_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avs_scale_44: {
        Row: {
          child_rent: number
          child_rent_1_2: number
          child_rent_1_4: number
          child_rent_3_4: number
          created_at: string | null
          disability_rent_1_2: number
          disability_rent_1_4: number
          disability_rent_3_4: number
          double_child_rent: number
          id: string
          income_threshold: number
          old_age_rent_full: number
          orphan_rent_60pct: number
          scale_year: number | null
          widow_additional_rent: number
          widow_rent_1_2: number
          widow_rent_1_4: number
          widow_rent_3_4: number
          widow_rent_full: number
        }
        Insert: {
          child_rent: number
          child_rent_1_2: number
          child_rent_1_4: number
          child_rent_3_4: number
          created_at?: string | null
          disability_rent_1_2: number
          disability_rent_1_4: number
          disability_rent_3_4: number
          double_child_rent: number
          id?: string
          income_threshold: number
          old_age_rent_full: number
          orphan_rent_60pct: number
          scale_year?: number | null
          widow_additional_rent: number
          widow_rent_1_2: number
          widow_rent_1_4: number
          widow_rent_3_4: number
          widow_rent_full: number
        }
        Update: {
          child_rent?: number
          child_rent_1_2?: number
          child_rent_1_4?: number
          child_rent_3_4?: number
          created_at?: string | null
          disability_rent_1_2?: number
          disability_rent_1_4?: number
          disability_rent_3_4?: number
          double_child_rent?: number
          id?: string
          income_threshold?: number
          old_age_rent_full?: number
          orphan_rent_60pct?: number
          scale_year?: number | null
          widow_additional_rent?: number
          widow_rent_1_2?: number
          widow_rent_1_4?: number
          widow_rent_3_4?: number
          widow_rent_full?: number
        }
        Relationships: []
      }
      budget_data: {
        Row: {
          autres_depenses: number | null
          autres_depenses_annuel: number | null
          autres_depenses_mensuel: number | null
          charges_sociales: number | null
          charges_sociales_1er_pilier: number | null
          charges_sociales_2eme_pilier: number | null
          charges_sociales_annuel: number | null
          charges_sociales_autres: number | null
          charges_sociales_mensuel: number | null
          created_at: string
          depenses_alimentation: number | null
          depenses_alimentation_annuel: number | null
          depenses_alimentation_mensuel: number | null
          depenses_logement: number | null
          depenses_logement_annuel: number | null
          depenses_logement_mensuel: number | null
          depenses_transport: number | null
          depenses_transport_annuel: number | null
          depenses_transport_mensuel: number | null
          id: string
          period_type: string
          revenu_brut: number | null
          revenu_brut_annuel: number | null
          revenu_brut_mensuel: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autres_depenses?: number | null
          autres_depenses_annuel?: number | null
          autres_depenses_mensuel?: number | null
          charges_sociales?: number | null
          charges_sociales_1er_pilier?: number | null
          charges_sociales_2eme_pilier?: number | null
          charges_sociales_annuel?: number | null
          charges_sociales_autres?: number | null
          charges_sociales_mensuel?: number | null
          created_at?: string
          depenses_alimentation?: number | null
          depenses_alimentation_annuel?: number | null
          depenses_alimentation_mensuel?: number | null
          depenses_logement?: number | null
          depenses_logement_annuel?: number | null
          depenses_logement_mensuel?: number | null
          depenses_transport?: number | null
          depenses_transport_annuel?: number | null
          depenses_transport_mensuel?: number | null
          id?: string
          period_type?: string
          revenu_brut?: number | null
          revenu_brut_annuel?: number | null
          revenu_brut_mensuel?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autres_depenses?: number | null
          autres_depenses_annuel?: number | null
          autres_depenses_mensuel?: number | null
          charges_sociales?: number | null
          charges_sociales_1er_pilier?: number | null
          charges_sociales_2eme_pilier?: number | null
          charges_sociales_annuel?: number | null
          charges_sociales_autres?: number | null
          charges_sociales_mensuel?: number | null
          created_at?: string
          depenses_alimentation?: number | null
          depenses_alimentation_annuel?: number | null
          depenses_alimentation_mensuel?: number | null
          depenses_logement?: number | null
          depenses_logement_annuel?: number | null
          depenses_logement_mensuel?: number | null
          depenses_transport?: number | null
          depenses_transport_annuel?: number | null
          depenses_transport_mensuel?: number | null
          id?: string
          period_type?: string
          revenu_brut?: number | null
          revenu_brut_annuel?: number | null
          revenu_brut_mensuel?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dependants: {
        Row: {
          created_at: string | null
          date_of_birth: string
          first_name: string
          gender: string | null
          id: string
          is_disabled: boolean | null
          is_student: boolean | null
          last_name: string
          profile_id: string
          relationship: string
          shared_custody: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          first_name: string
          gender?: string | null
          id?: string
          is_disabled?: boolean | null
          is_student?: boolean | null
          last_name: string
          profile_id: string
          relationship: string
          shared_custody?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          id?: string
          is_disabled?: boolean | null
          is_student?: boolean | null
          last_name?: string
          profile_id?: string
          relationship?: string
          shared_custody?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          extracted_data: Json | null
          extraction_date: string | null
          extraction_status: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          subcategory: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category?: string
          extracted_data?: Json | null
          extraction_date?: string | null
          extraction_status?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          subcategory?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string
          extracted_data?: Json | null
          extraction_date?: string | null
          extraction_status?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          subcategory?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_contracts: {
        Row: {
          annual_premium: number
          company_name: string
          contract_number: string | null
          coverage_amount: number | null
          created_at: string | null
          death_capital: number | null
          deductible: number | null
          disability_rent_annual: number | null
          end_date: string | null
          id: string
          insurance_type: string
          is_active: boolean | null
          notes: string | null
          profile_id: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          annual_premium?: number
          company_name: string
          contract_number?: string | null
          coverage_amount?: number | null
          created_at?: string | null
          death_capital?: number | null
          deductible?: number | null
          disability_rent_annual?: number | null
          end_date?: string | null
          id?: string
          insurance_type: string
          is_active?: boolean | null
          notes?: string | null
          profile_id: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_premium?: number
          company_name?: string
          contract_number?: string | null
          coverage_amount?: number | null
          created_at?: string | null
          death_capital?: number | null
          deductible?: number | null
          disability_rent_annual?: number | null
          end_date?: string | null
          id?: string
          insurance_type?: string
          is_active?: boolean | null
          notes?: string | null
          profile_id?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lpp_accounts: {
        Row: {
          additional_death_capital: number | null
          admin_fees: number | null
          avs_salary: number | null
          child_disability_rent_annual: number | null
          contract_number: string | null
          conversion_rate_at_65: number | null
          coordination_deduction: number | null
          created_at: string | null
          current_retirement_savings: number | null
          death_capital: number | null
          disability_rent_annual: number | null
          employee_risk_contribution: number | null
          employee_savings_contribution: number | null
          employer_risk_contribution: number | null
          employer_savings_contribution: number | null
          entry_date: string | null
          epl_min_amount_remaining: number | null
          epl_pledge_amount: number | null
          epl_pledged: boolean | null
          epl_withdrawal_amount: number | null
          epl_withdrawal_date: string | null
          id: string
          insured_salary: number | null
          interest_rate: number | null
          is_active: boolean | null
          last_buyback_amount: number | null
          last_buyback_date: string | null
          last_certificate_date: string | null
          max_buyback_amount: number | null
          notes: string | null
          orphan_rent_annual: number | null
          plan_name: string | null
          profile_id: string
          projected_retirement_rent_at_60: number | null
          projected_retirement_rent_at_61: number | null
          projected_retirement_rent_at_62: number | null
          projected_retirement_rent_at_63: number | null
          projected_retirement_rent_at_64: number | null
          projected_retirement_rent_at_65: number | null
          projected_savings_at_65: number | null
          provider_name: string
          total_annual_contribution: number | null
          updated_at: string | null
          waiting_period_days: number | null
          widow_rent_annual: number | null
        }
        Insert: {
          additional_death_capital?: number | null
          admin_fees?: number | null
          avs_salary?: number | null
          child_disability_rent_annual?: number | null
          contract_number?: string | null
          conversion_rate_at_65?: number | null
          coordination_deduction?: number | null
          created_at?: string | null
          current_retirement_savings?: number | null
          death_capital?: number | null
          disability_rent_annual?: number | null
          employee_risk_contribution?: number | null
          employee_savings_contribution?: number | null
          employer_risk_contribution?: number | null
          employer_savings_contribution?: number | null
          entry_date?: string | null
          epl_min_amount_remaining?: number | null
          epl_pledge_amount?: number | null
          epl_pledged?: boolean | null
          epl_withdrawal_amount?: number | null
          epl_withdrawal_date?: string | null
          id?: string
          insured_salary?: number | null
          interest_rate?: number | null
          is_active?: boolean | null
          last_buyback_amount?: number | null
          last_buyback_date?: string | null
          last_certificate_date?: string | null
          max_buyback_amount?: number | null
          notes?: string | null
          orphan_rent_annual?: number | null
          plan_name?: string | null
          profile_id: string
          projected_retirement_rent_at_60?: number | null
          projected_retirement_rent_at_61?: number | null
          projected_retirement_rent_at_62?: number | null
          projected_retirement_rent_at_63?: number | null
          projected_retirement_rent_at_64?: number | null
          projected_retirement_rent_at_65?: number | null
          projected_savings_at_65?: number | null
          provider_name: string
          total_annual_contribution?: number | null
          updated_at?: string | null
          waiting_period_days?: number | null
          widow_rent_annual?: number | null
        }
        Update: {
          additional_death_capital?: number | null
          admin_fees?: number | null
          avs_salary?: number | null
          child_disability_rent_annual?: number | null
          contract_number?: string | null
          conversion_rate_at_65?: number | null
          coordination_deduction?: number | null
          created_at?: string | null
          current_retirement_savings?: number | null
          death_capital?: number | null
          disability_rent_annual?: number | null
          employee_risk_contribution?: number | null
          employee_savings_contribution?: number | null
          employer_risk_contribution?: number | null
          employer_savings_contribution?: number | null
          entry_date?: string | null
          epl_min_amount_remaining?: number | null
          epl_pledge_amount?: number | null
          epl_pledged?: boolean | null
          epl_withdrawal_amount?: number | null
          epl_withdrawal_date?: string | null
          id?: string
          insured_salary?: number | null
          interest_rate?: number | null
          is_active?: boolean | null
          last_buyback_amount?: number | null
          last_buyback_date?: string | null
          last_certificate_date?: string | null
          max_buyback_amount?: number | null
          notes?: string | null
          orphan_rent_annual?: number | null
          plan_name?: string | null
          profile_id?: string
          projected_retirement_rent_at_60?: number | null
          projected_retirement_rent_at_61?: number | null
          projected_retirement_rent_at_62?: number | null
          projected_retirement_rent_at_63?: number | null
          projected_retirement_rent_at_64?: number | null
          projected_retirement_rent_at_65?: number | null
          projected_savings_at_65?: number | null
          provider_name?: string
          total_annual_contribution?: number | null
          updated_at?: string | null
          waiting_period_days?: number | null
          widow_rent_annual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lpp_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prevoyance_data: {
        Row: {
          avs_1er_pilier: number | null
          avs_rente_enfant_annuelle: number | null
          avs_rente_enfant_mensuelle: number | null
          besoin_pourcentage: number | null
          created_at: string
          etat_civil: string | null
          id: string
          lpp_2eme_pilier: number | null
          lpp_avoir_vieillesse: number | null
          lpp_capital_deces: number | null
          lpp_capital_invalidite: number | null
          lpp_capital_projete_65: number | null
          lpp_derniere_maj: string | null
          lpp_rente_annuelle_projetee: number | null
          lpp_rente_conjoint_survivant: number | null
          lpp_rente_enfant_invalide: number | null
          lpp_rente_invalidite_annuelle: number | null
          lpp_rente_invalidite_mensuelle: number | null
          lpp_rente_mensuelle_projetee: number | null
          lpp_rente_orphelins: number | null
          nombre_enfants: number | null
          pilier_3a: number | null
          pilier_3b: number | null
          rente_invalidite_annuelle: number | null
          rente_invalidite_mensuelle: number | null
          rente_vieillesse_annuelle: number | null
          rente_vieillesse_mensuelle: number | null
          revenu_annuel_determinant: number | null
          revenu_brut_reference: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avs_1er_pilier?: number | null
          avs_rente_enfant_annuelle?: number | null
          avs_rente_enfant_mensuelle?: number | null
          besoin_pourcentage?: number | null
          created_at?: string
          etat_civil?: string | null
          id?: string
          lpp_2eme_pilier?: number | null
          lpp_avoir_vieillesse?: number | null
          lpp_capital_deces?: number | null
          lpp_capital_invalidite?: number | null
          lpp_capital_projete_65?: number | null
          lpp_derniere_maj?: string | null
          lpp_rente_annuelle_projetee?: number | null
          lpp_rente_conjoint_survivant?: number | null
          lpp_rente_enfant_invalide?: number | null
          lpp_rente_invalidite_annuelle?: number | null
          lpp_rente_invalidite_mensuelle?: number | null
          lpp_rente_mensuelle_projetee?: number | null
          lpp_rente_orphelins?: number | null
          nombre_enfants?: number | null
          pilier_3a?: number | null
          pilier_3b?: number | null
          rente_invalidite_annuelle?: number | null
          rente_invalidite_mensuelle?: number | null
          rente_vieillesse_annuelle?: number | null
          rente_vieillesse_mensuelle?: number | null
          revenu_annuel_determinant?: number | null
          revenu_brut_reference?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avs_1er_pilier?: number | null
          avs_rente_enfant_annuelle?: number | null
          avs_rente_enfant_mensuelle?: number | null
          besoin_pourcentage?: number | null
          created_at?: string
          etat_civil?: string | null
          id?: string
          lpp_2eme_pilier?: number | null
          lpp_avoir_vieillesse?: number | null
          lpp_capital_deces?: number | null
          lpp_capital_invalidite?: number | null
          lpp_capital_projete_65?: number | null
          lpp_derniere_maj?: string | null
          lpp_rente_annuelle_projetee?: number | null
          lpp_rente_conjoint_survivant?: number | null
          lpp_rente_enfant_invalide?: number | null
          lpp_rente_invalidite_annuelle?: number | null
          lpp_rente_invalidite_mensuelle?: number | null
          lpp_rente_mensuelle_projetee?: number | null
          lpp_rente_orphelins?: number | null
          nombre_enfants?: number | null
          pilier_3a?: number | null
          pilier_3b?: number | null
          rente_invalidite_annuelle?: number | null
          rente_invalidite_mensuelle?: number | null
          rente_vieillesse_annuelle?: number | null
          rente_vieillesse_mensuelle?: number | null
          revenu_annuel_determinant?: number | null
          revenu_brut_reference?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adresse: string | null
          appellation: string
          canton: string | null
          commune: string | null
          created_at: string
          date_naissance: string
          email: string
          employer_name: string | null
          etat_civil: string | null
          gender: string | null
          household_mode: string | null
          housing_status: string | null
          id: string
          localite: string
          nationality: string | null
          nom: string
          nombre_enfants: number | null
          permit_type: string | null
          prenom: string
          profession: string | null
          telephone: string | null
          updated_at: string
          user_id: string
          work_rate: number | null
        }
        Insert: {
          adresse?: string | null
          appellation: string
          canton?: string | null
          commune?: string | null
          created_at?: string
          date_naissance: string
          email: string
          employer_name?: string | null
          etat_civil?: string | null
          gender?: string | null
          household_mode?: string | null
          housing_status?: string | null
          id?: string
          localite: string
          nationality?: string | null
          nom: string
          nombre_enfants?: number | null
          permit_type?: string | null
          prenom: string
          profession?: string | null
          telephone?: string | null
          updated_at?: string
          user_id: string
          work_rate?: number | null
        }
        Update: {
          adresse?: string | null
          appellation?: string
          canton?: string | null
          commune?: string | null
          created_at?: string
          date_naissance?: string
          email?: string
          employer_name?: string | null
          etat_civil?: string | null
          gender?: string | null
          household_mode?: string | null
          housing_status?: string | null
          id?: string
          localite?: string
          nationality?: string | null
          nom?: string
          nombre_enfants?: number | null
          permit_type?: string | null
          prenom?: string
          profession?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
          work_rate?: number | null
        }
        Relationships: []
      }
      tax_data: {
        Row: {
          autres_deductions: number | null
          canton: string
          charges_sociales: number | null
          commune: string
          confession: string | null
          created_at: string
          deduction_3eme_pilier: number | null
          etat_civil: string
          fortune: number | null
          id: string
          impot_cantonal: number | null
          impot_communal: number | null
          impot_ecclesiastique: number | null
          impot_federal: number | null
          impot_fortune: number | null
          interets_hypothecaires: number | null
          nombre_enfants: number | null
          revenu_annuel: number
          total_impots: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autres_deductions?: number | null
          canton: string
          charges_sociales?: number | null
          commune: string
          confession?: string | null
          created_at?: string
          deduction_3eme_pilier?: number | null
          etat_civil: string
          fortune?: number | null
          id?: string
          impot_cantonal?: number | null
          impot_communal?: number | null
          impot_ecclesiastique?: number | null
          impot_federal?: number | null
          impot_fortune?: number | null
          interets_hypothecaires?: number | null
          nombre_enfants?: number | null
          revenu_annuel?: number
          total_impots?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autres_deductions?: number | null
          canton?: string
          charges_sociales?: number | null
          commune?: string
          confession?: string | null
          created_at?: string
          deduction_3eme_pilier?: number | null
          etat_civil?: string
          fortune?: number | null
          id?: string
          impot_cantonal?: number | null
          impot_communal?: number | null
          impot_ecclesiastique?: number | null
          impot_federal?: number | null
          impot_fortune?: number | null
          interets_hypothecaires?: number | null
          nombre_enfants?: number | null
          revenu_annuel?: number
          total_impots?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      third_pillar_accounts: {
        Row: {
          account_type: string
          annual_contribution: number
          contract_number: string | null
          created_at: string | null
          current_amount: number
          id: string
          institution_name: string
          is_active: boolean | null
          notes: string | null
          profile_id: string
          projected_amount_at_retirement: number | null
          projected_annual_rent: number | null
          return_rate: number
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          annual_contribution?: number
          contract_number?: string | null
          created_at?: string | null
          current_amount?: number
          id?: string
          institution_name: string
          is_active?: boolean | null
          notes?: string | null
          profile_id: string
          projected_amount_at_retirement?: number | null
          projected_annual_rent?: number | null
          return_rate?: number
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          annual_contribution?: number
          contract_number?: string | null
          created_at?: string | null
          current_amount?: number
          id?: string
          institution_name?: string
          is_active?: boolean | null
          notes?: string | null
          profile_id?: string
          projected_amount_at_retirement?: number | null
          projected_annual_rent?: number | null
          return_rate?: number
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "third_pillar_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      migrate_prevoyance_to_lpp: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
