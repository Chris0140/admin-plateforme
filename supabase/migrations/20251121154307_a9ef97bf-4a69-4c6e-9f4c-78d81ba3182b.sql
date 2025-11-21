-- Create table for monthly custom expense categories
CREATE TABLE IF NOT EXISTS monthly_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month, name)
);

-- Enable RLS
ALTER TABLE monthly_expense_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own monthly expense categories"
ON monthly_expense_categories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_monthly_expense_categories_user_date 
ON monthly_expense_categories(user_id, year, month);

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_expense_categories_updated_at
  BEFORE UPDATE ON monthly_expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();