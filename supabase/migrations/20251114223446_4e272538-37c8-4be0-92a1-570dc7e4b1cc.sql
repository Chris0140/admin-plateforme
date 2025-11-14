-- Add category column to documents table
ALTER TABLE public.documents 
ADD COLUMN category TEXT NOT NULL DEFAULT 'autres',
ADD COLUMN subcategory TEXT;

-- Add check constraint for valid categories
ALTER TABLE public.documents 
ADD CONSTRAINT valid_category 
CHECK (category IN ('assurance', 'prevoyance_retraite', 'impots', 'autres'));

-- Create index for better performance
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_user_category ON public.documents(user_id, category);