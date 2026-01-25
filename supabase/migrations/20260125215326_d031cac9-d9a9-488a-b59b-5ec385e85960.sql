-- Add account_id column to budget_monthly table
ALTER TABLE budget_monthly 
ADD COLUMN account_id uuid REFERENCES budget_accounts(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_budget_monthly_account_id ON budget_monthly(account_id);

-- Update unique constraint to include account_id
ALTER TABLE budget_monthly 
DROP CONSTRAINT IF EXISTS budget_monthly_user_id_year_month_key;

ALTER TABLE budget_monthly 
ADD CONSTRAINT budget_monthly_user_account_year_month_key 
UNIQUE (user_id, account_id, year, month);