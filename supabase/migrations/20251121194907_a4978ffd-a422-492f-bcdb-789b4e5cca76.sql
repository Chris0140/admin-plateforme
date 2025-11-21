-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Create index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Assign admin role to chrisas144@gmail.com
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user_id from email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'chrisas144@gmail.com';
  
  -- Insert admin role if user exists
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for budget_data table
DROP POLICY IF EXISTS "Admins can view all budget data" ON public.budget_data;
CREATE POLICY "Admins can view all budget data"
ON public.budget_data FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for budget_monthly table
DROP POLICY IF EXISTS "Admins can view all monthly budget" ON public.budget_monthly;
CREATE POLICY "Admins can view all monthly budget"
ON public.budget_monthly FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for lpp_accounts table
DROP POLICY IF EXISTS "Admins can view all LPP accounts" ON public.lpp_accounts;
CREATE POLICY "Admins can view all LPP accounts"
ON public.lpp_accounts FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for third_pillar_accounts table
DROP POLICY IF EXISTS "Admins can view all third pillar accounts" ON public.third_pillar_accounts;
CREATE POLICY "Admins can view all third pillar accounts"
ON public.third_pillar_accounts FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for insurance_contracts table
DROP POLICY IF EXISTS "Admins can view all insurance contracts" ON public.insurance_contracts;
CREATE POLICY "Admins can view all insurance contracts"
ON public.insurance_contracts FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for avs_profiles table
DROP POLICY IF EXISTS "Admins can view all AVS profiles" ON public.avs_profiles;
CREATE POLICY "Admins can view all AVS profiles"
ON public.avs_profiles FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for tax_data table
DROP POLICY IF EXISTS "Admins can view all tax data" ON public.tax_data;
CREATE POLICY "Admins can view all tax data"
ON public.tax_data FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for documents table
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for dependants table
DROP POLICY IF EXISTS "Admins can view all dependants" ON public.dependants;
CREATE POLICY "Admins can view all dependants"
ON public.dependants FOR SELECT
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for fixed_expenses table
DROP POLICY IF EXISTS "Admins can view all fixed expenses" ON public.fixed_expenses;
CREATE POLICY "Admins can view all fixed expenses"
ON public.fixed_expenses FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Update RLS policies for monthly_expense_categories table
DROP POLICY IF EXISTS "Admins can view all monthly expense categories" ON public.monthly_expense_categories;
CREATE POLICY "Admins can view all monthly expense categories"
ON public.monthly_expense_categories FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);