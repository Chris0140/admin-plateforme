-- Phase 1: AVS Foundations & Enriched Profiles
-- Create avs_scale_44 reference table

CREATE TABLE avs_scale_44 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Income threshold
  income_threshold NUMERIC NOT NULL UNIQUE,
  
  -- Full pensions (1/1) - Base for old-age & disability
  old_age_rent_full NUMERIC NOT NULL,
  
  -- Full survivor pensions (1/1)
  widow_rent_full NUMERIC NOT NULL,
  widow_additional_rent NUMERIC NOT NULL,
  
  -- Full children pensions
  child_rent NUMERIC NOT NULL,
  orphan_rent_60pct NUMERIC NOT NULL,
  double_child_rent NUMERIC NOT NULL,
  
  -- Partial disability pensions (3/4, 1/2, 1/4)
  disability_rent_3_4 NUMERIC NOT NULL,
  disability_rent_1_2 NUMERIC NOT NULL,
  disability_rent_1_4 NUMERIC NOT NULL,
  
  -- Partial widow/widower pensions (3/4, 1/2, 1/4)
  widow_rent_3_4 NUMERIC NOT NULL,
  widow_rent_1_2 NUMERIC NOT NULL,
  widow_rent_1_4 NUMERIC NOT NULL,
  
  -- Partial children pensions (3/4, 1/2, 1/4)
  child_rent_3_4 NUMERIC NOT NULL,
  child_rent_1_2 NUMERIC NOT NULL,
  child_rent_1_4 NUMERIC NOT NULL,
  
  -- Metadata
  scale_year INTEGER DEFAULT 2025,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_avs_scale_income ON avs_scale_44(income_threshold);

-- Import the 51 rows from Échelle 44 2025
INSERT INTO avs_scale_44 (income_threshold, old_age_rent_full, widow_rent_full, widow_additional_rent, child_rent, orphan_rent_60pct, double_child_rent, disability_rent_3_4, disability_rent_1_2, disability_rent_1_4, widow_rent_3_4, widow_rent_1_2, widow_rent_1_4, child_rent_3_4, child_rent_1_2, child_rent_1_4) VALUES
(15120, 1260, 1512, 1008, 378, 504, 756, 945, 630, 315, 1134, 756, 378, 378, 252, 126),
(16632, 1293, 1551, 1034, 388, 517, 776, 970, 647, 324, 1164, 776, 388, 388, 259, 130),
(18144, 1326, 1591, 1060, 398, 530, 795, 995, 663, 332, 1194, 796, 398, 398, 265, 133),
(19656, 1358, 1630, 1087, 407, 543, 815, 1019, 679, 340, 1223, 815, 408, 408, 272, 136),
(21168, 1391, 1669, 1113, 417, 556, 835, 1044, 696, 348, 1252, 835, 418, 417, 278, 139),
(22680, 1424, 1709, 1139, 427, 570, 854, 1068, 712, 356, 1282, 855, 428, 428, 285, 143),
(24192, 1457, 1748, 1165, 437, 583, 874, 1093, 729, 365, 1311, 874, 437, 438, 292, 146),
(25704, 1489, 1787, 1191, 447, 596, 894, 1117, 745, 373, 1341, 894, 447, 447, 298, 149),
(27216, 1522, 1826, 1218, 457, 609, 913, 1142, 761, 381, 1370, 913, 457, 457, 305, 153),
(28728, 1555, 1866, 1244, 466, 622, 933, 1167, 778, 389, 1400, 933, 467, 467, 311, 156),
(30240, 1588, 1905, 1270, 476, 635, 953, 1191, 794, 397, 1429, 953, 477, 477, 318, 159),
(31752, 1620, 1944, 1296, 486, 648, 972, 1215, 810, 405, 1458, 972, 486, 486, 324, 162),
(33264, 1653, 1984, 1322, 496, 661, 992, 1240, 827, 414, 1488, 992, 496, 496, 331, 166),
(34776, 1686, 2023, 1349, 506, 674, 1011, 1265, 843, 422, 1518, 1012, 506, 506, 337, 169),
(36288, 1719, 2062, 1375, 516, 687, 1031, 1290, 860, 430, 1547, 1031, 516, 516, 344, 172),
(37800, 1751, 2102, 1401, 525, 701, 1051, 1314, 876, 438, 1577, 1051, 526, 526, 351, 176),
(39312, 1784, 2141, 1427, 535, 714, 1070, 1338, 892, 446, 1606, 1071, 536, 536, 357, 179),
(40824, 1817, 2180, 1454, 545, 727, 1090, 1363, 909, 455, 1636, 1091, 546, 545, 364, 182),
(42336, 1850, 2220, 1480, 555, 740, 1110, 1388, 925, 463, 1665, 1110, 555, 555, 370, 185),
(43848, 1882, 2259, 1506, 565, 753, 1129, 1412, 941, 471, 1694, 1129, 565, 565, 377, 189),
(45360, 1915, 2298, 1532, 575, 766, 1149, 1437, 958, 479, 1724, 1149, 575, 575, 384, 192),
(46872, 1935, 2322, 1548, 581, 774, 1161, 1452, 968, 484, 1742, 1161, 581, 581, 387, 194),
(48384, 1956, 2347, 1564, 587, 782, 1173, 1467, 978, 489, 1760, 1173, 587, 587, 391, 196),
(49896, 1976, 2371, 1580, 593, 790, 1185, 1482, 988, 494, 1778, 1185, 593, 593, 395, 198),
(51408, 1996, 2395, 1597, 599, 798, 1197, 1497, 998, 499, 1796, 1197, 599, 599, 399, 200),
(52920, 2016, 2419, 1613, 605, 806, 1210, 1512, 1008, 504, 1814, 1210, 605, 605, 403, 202),
(54432, 2036, 2443, 1629, 611, 814, 1222, 1527, 1018, 509, 1832, 1222, 611, 611, 407, 204),
(55944, 2056, 2468, 1645, 617, 823, 1234, 1542, 1028, 514, 1851, 1234, 617, 617, 411, 206),
(57456, 2076, 2492, 1661, 623, 831, 1246, 1557, 1038, 519, 1869, 1246, 623, 623, 415, 208),
(58968, 2097, 2516, 1677, 629, 839, 1258, 1573, 1049, 525, 1887, 1258, 629, 629, 420, 210),
(60480, 2117, 2520, 1693, 635, 847, 1270, 1588, 1059, 530, 1890, 1260, 630, 635, 424, 212),
(61992, 2137, 2520, 1710, 641, 855, 1282, 1603, 1069, 535, 1890, 1260, 630, 641, 428, 214),
(63504, 2157, 2520, 1726, 647, 863, 1294, 1618, 1079, 540, 1890, 1260, 630, 647, 432, 216),
(65016, 2177, 2520, 1742, 653, 871, 1306, 1633, 1089, 545, 1890, 1260, 630, 653, 436, 218),
(66528, 2197, 2520, 1758, 659, 879, 1318, 1648, 1099, 550, 1890, 1260, 630, 659, 440, 220),
(68040, 2218, 2520, 1774, 665, 887, 1331, 1664, 1109, 555, 1890, 1260, 630, 665, 444, 222),
(69552, 2238, 2520, 1790, 671, 895, 1343, 1679, 1119, 560, 1890, 1260, 630, 671, 448, 224),
(71064, 2258, 2520, 1806, 677, 903, 1355, 1694, 1129, 565, 1890, 1260, 630, 677, 452, 226),
(72576, 2278, 2520, 1822, 683, 911, 1367, 1709, 1139, 570, 1890, 1260, 630, 683, 456, 228),
(74088, 2298, 2520, 1839, 689, 919, 1379, 1724, 1149, 575, 1890, 1260, 630, 689, 460, 230),
(75600, 2318, 2520, 1855, 696, 927, 1391, 1739, 1159, 580, 1890, 1260, 630, 696, 464, 232),
(77112, 2339, 2520, 1871, 702, 935, 1403, 1755, 1170, 585, 1890, 1260, 630, 702, 468, 234),
(78624, 2359, 2520, 1887, 708, 943, 1415, 1770, 1180, 590, 1890, 1260, 630, 708, 472, 236),
(80136, 2379, 2520, 1903, 714, 952, 1427, 1785, 1190, 595, 1890, 1260, 630, 714, 476, 238),
(81648, 2399, 2520, 1919, 720, 960, 1439, 1800, 1200, 600, 1890, 1260, 630, 720, 480, 240),
(83160, 2419, 2520, 1935, 726, 968, 1452, 1815, 1210, 605, 1890, 1260, 630, 726, 484, 242),
(84672, 2439, 2520, 1951, 732, 976, 1464, 1830, 1220, 610, 1890, 1260, 630, 732, 488, 244),
(86184, 2460, 2520, 1968, 738, 984, 1476, 1845, 1230, 615, 1890, 1260, 630, 738, 492, 246),
(87696, 2480, 2520, 1984, 744, 992, 1488, 1860, 1240, 620, 1890, 1260, 630, 744, 496, 248),
(89208, 2500, 2520, 2000, 750, 1000, 1500, 1875, 1250, 625, 1890, 1260, 630, 750, 500, 250),
(90720, 2520, 2520, 2016, 756, 1008, 1512, 1890, 1260, 630, 1890, 1260, 630, 756, 504, 252);

-- Create avs_profiles table
CREATE TABLE avs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contribution history
  years_contributed INTEGER DEFAULT 0 
    CHECK (years_contributed >= 0 AND years_contributed <= 44),
  years_missing INTEGER DEFAULT 44 
    CHECK (years_missing >= 0 AND years_missing <= 44),
  has_gaps BOOLEAN DEFAULT false,
  
  -- Calculation basis
  average_annual_income_determinant NUMERIC DEFAULT 0,
  scale_used TEXT DEFAULT '44',
  
  -- Pension coefficient
  full_rent_fraction NUMERIC DEFAULT 1.0 
    CHECK (full_rent_fraction >= 0 AND full_rent_fraction <= 1),
  
  -- Audit
  last_calculation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(profile_id)
);

-- RLS for avs_profiles
ALTER TABLE avs_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own avs_profiles"
ON avs_profiles FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Trigger for avs_profiles updated_at
CREATE TRIGGER update_avs_profiles_updated_at
BEFORE UPDATE ON avs_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enrich profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'Autre')),
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Suisse',
ADD COLUMN IF NOT EXISTS permit_type TEXT CHECK (permit_type IN ('B', 'C', 'G', 'L', 'Frontalier', 'Autre')),
ADD COLUMN IF NOT EXISTS canton TEXT,
ADD COLUMN IF NOT EXISTS commune TEXT,
ADD COLUMN IF NOT EXISTS housing_status TEXT CHECK (housing_status IN ('locataire', 'propriétaire', 'autre')),
ADD COLUMN IF NOT EXISTS household_mode TEXT CHECK (household_mode IN ('individuel', 'couple')) DEFAULT 'individuel',
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS employer_name TEXT,
ADD COLUMN IF NOT EXISTS work_rate NUMERIC CHECK (work_rate >= 0 AND work_rate <= 100) DEFAULT 100;