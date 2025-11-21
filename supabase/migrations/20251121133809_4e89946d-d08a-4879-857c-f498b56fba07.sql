-- Fix RLS for avs_scale_44 reference table
-- This is a public reference table, everyone should be able to read it

ALTER TABLE avs_scale_44 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AVS scale is publicly readable"
ON avs_scale_44
FOR SELECT
USING (true);