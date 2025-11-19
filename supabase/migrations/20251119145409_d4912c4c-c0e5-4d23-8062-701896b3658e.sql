-- Step 1: Migrate any existing prevoyance data from budget_data to prevoyance_data if not already present
INSERT INTO prevoyance_data (user_id, avs_1er_pilier, lpp_2eme_pilier, pilier_3a, pilier_3b)
SELECT 
  bd.user_id,
  COALESCE(bd.avs_1er_pilier, 0),
  COALESCE(bd.lpp_2eme_pilier, 0),
  COALESCE(bd.pilier_3a, 0),
  COALESCE(bd.pilier_3b, 0)
FROM budget_data bd
WHERE NOT EXISTS (
  SELECT 1 FROM prevoyance_data pd WHERE pd.user_id = bd.user_id
)
AND bd.user_id IS NOT NULL;

-- Step 2: Remove prevoyance columns from budget_data table
ALTER TABLE budget_data DROP COLUMN IF EXISTS avs_1er_pilier;
ALTER TABLE budget_data DROP COLUMN IF EXISTS lpp_2eme_pilier;
ALTER TABLE budget_data DROP COLUMN IF EXISTS pilier_3a;
ALTER TABLE budget_data DROP COLUMN IF EXISTS pilier_3b;