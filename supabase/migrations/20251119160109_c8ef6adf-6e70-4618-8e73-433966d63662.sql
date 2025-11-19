-- Add columns to documents table for PDF extraction
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extracted_data jsonb,
  ADD COLUMN IF NOT EXISTS extraction_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS extraction_date timestamp with time zone;