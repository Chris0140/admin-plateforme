import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BudgetProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  residence_status: "resident" | "frontalier";
  professional_status: "employe" | "independant";
  job_title: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetAccount {
  id: string;
  user_id: string;
  account_type: "courant" | "epargne" | "autre";
  bank_name: string;
  revenue_type: "regulier" | "variable";
  accounting_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingState {
  isLoading: boolean;
  hasProfile: boolean;
  hasAccount: boolean;
  profile: BudgetProfile | null;
  accounts: BudgetAccount[];
}

const LOCAL_PROFILE_KEY = "budget_profile_guest";
const LOCAL_ACCOUNTS_KEY = "budget_accounts_guest";

// Helper to get guest profile from localStorage
const getGuestProfile = (): BudgetProfile | null => {
  try {
    const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to get guest accounts from localStorage
const getGuestAccounts = (): BudgetAccount[] => {
  try {
    const stored = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export function useBudgetOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    isLoading: true,
    hasProfile: false,
    hasAccount: false,
    profile: null,
    accounts: [],
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    const fetchOnboardingStatus = async () => {
      try {
        if (user) {
          // Authenticated user: fetch from Supabase
          const [profileRes, accountsRes] = await Promise.all([
            supabase
              .from("budget_profiles")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("budget_accounts")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_active", true),
          ]);

          const profile = profileRes.data as BudgetProfile | null;
          const accounts = (accountsRes.data || []) as BudgetAccount[];

          setState({
            isLoading: false,
            hasProfile: !!profile && profile.onboarding_completed,
            hasAccount: accounts.length > 0,
            profile,
            accounts,
          });
        } else {
          // Guest user: fetch from localStorage
          const profile = getGuestProfile();
          const accounts = getGuestAccounts();

          setState({
            isLoading: false,
            hasProfile: !!profile && profile.onboarding_completed,
            hasAccount: accounts.length > 0,
            profile,
            accounts,
          });
        }
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchOnboardingStatus();
  }, [user, authLoading]);

  return state;
}
