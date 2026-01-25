-- Add contract_id column to documents table for linking documents to insurance contracts
ALTER TABLE public.documents 
ADD COLUMN contract_id uuid REFERENCES public.insurance_contracts(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_documents_contract_id ON public.documents(contract_id);

-- Update RLS policies to allow access via contract ownership
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

-- Recreate policies with contract_id support
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    contract_id IS NOT NULL 
    AND contract_id IN (
      SELECT ic.id FROM insurance_contracts ic
      JOIN profiles p ON ic.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" 
ON public.documents 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);