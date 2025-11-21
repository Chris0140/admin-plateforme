-- Add new columns to third_pillar_accounts table
ALTER TABLE third_pillar_accounts
ADD COLUMN IF NOT EXISTS disability_rent_annual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS death_capital numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_exemption_waiting_period integer;

-- Add comment to clarify the waiting period values
COMMENT ON COLUMN third_pillar_accounts.premium_exemption_waiting_period IS 'Waiting period in months for premium exemption in case of disability (3, 6, 12, or 24 months)';