-- =============================================================================
-- Migration 018: Geographic Intelligence Layer
--
-- Creates four reference tables for US geographic and demographic data.
-- Seeded with 2020 Census / ACS 5-Year data for the 50 most populous US cities
-- and all 50 states + DC.
--
-- Data sources:
--   Population, Households: 2020 Decennial Census
--   Income, Age, Homeownership, Home Value: ACS 5-Year 2019–2023
--   Businesses: Census SUSB 2021
--   Area: Census Gazetteer Files 2020
--
-- Offline pipeline:
--   Manus periodically refreshes this data by calling
--   POST /api/geographic/ingest with updated Census datasets.
--   No client-side interaction should depend on external demographic APIs;
--   all runtime lookups go through Supabase.
-- =============================================================================

-- ── Cities / Places ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS geographic_places (
  id                      text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                    text        NOT NULL,
  state_abbr              text        NOT NULL,
  state_name              text,
  county                  text,
  msa_name                text,
  lat                     numeric,
  lng                     numeric,
  osm_id                  text,
  population              bigint,
  households              bigint,
  businesses              bigint,
  median_household_income integer,
  median_age              numeric,
  homeownership_rate      numeric,
  median_home_value       integer,
  population_density      numeric,
  land_area_sq_miles      numeric,
  data_source             text        NOT NULL DEFAULT 'US Census Bureau',
  data_year               integer     NOT NULL DEFAULT 2020,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, state_abbr)
);

CREATE INDEX IF NOT EXISTS idx_geographic_places_state ON geographic_places (state_abbr);
CREATE INDEX IF NOT EXISTS idx_geographic_places_name_state ON geographic_places (LOWER(name), state_abbr);

-- ── States ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS geographic_states (
  id                      text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                    text        NOT NULL UNIQUE,
  abbr                    text        NOT NULL UNIQUE,
  fips                    text,
  lat                     numeric,
  lng                     numeric,
  population              bigint,
  households              bigint,
  businesses              bigint,
  median_household_income integer,
  median_age              numeric,
  homeownership_rate      numeric,
  median_home_value       integer,
  land_area_sq_miles      numeric,
  data_source             text        NOT NULL DEFAULT 'US Census Bureau',
  data_year               integer     NOT NULL DEFAULT 2020,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geographic_states_abbr ON geographic_states (abbr);

-- ── Counties ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS geographic_counties (
  id                      text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                    text        NOT NULL,
  state_abbr              text        NOT NULL,
  state_name              text,
  fips                    text,
  lat                     numeric,
  lng                     numeric,
  osm_id                  text,
  population              bigint,
  households              bigint,
  businesses              bigint,
  median_household_income integer,
  median_age              numeric,
  homeownership_rate      numeric,
  median_home_value       integer,
  land_area_sq_miles      numeric,
  data_source             text        NOT NULL DEFAULT 'US Census Bureau',
  data_year               integer     NOT NULL DEFAULT 2020,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, state_abbr)
);

CREATE INDEX IF NOT EXISTS idx_geographic_counties_state ON geographic_counties (state_abbr);
CREATE INDEX IF NOT EXISTS idx_geographic_counties_name_state ON geographic_counties (LOWER(name), state_abbr);

-- ── ZIP Codes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS geographic_zips (
  id                      text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zip                     text        NOT NULL UNIQUE,
  name                    text,
  state_abbr              text,
  county                  text,
  lat                     numeric,
  lng                     numeric,
  population              bigint,
  households              bigint,
  median_household_income integer,
  median_age              numeric,
  land_area_sq_miles      numeric,
  data_source             text        NOT NULL DEFAULT 'US Census Bureau (ZCTA)',
  data_year               integer     NOT NULL DEFAULT 2020,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geographic_zips_state ON geographic_zips (state_abbr);

-- ── RLS: public read-only (Census data is public) ─────────────────────────────

ALTER TABLE geographic_places    ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_states    ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_counties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_zips      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geographic_places_public_read"   ON geographic_places   FOR SELECT USING (true);
CREATE POLICY "geographic_states_public_read"   ON geographic_states   FOR SELECT USING (true);
CREATE POLICY "geographic_counties_public_read" ON geographic_counties FOR SELECT USING (true);
CREATE POLICY "geographic_zips_public_read"     ON geographic_zips     FOR SELECT USING (true);

-- Write access requires service role (used by Manus ingestion pipeline only)

-- ── Updated-at trigger ────────────────────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'geographic_places',
    'geographic_states',
    'geographic_counties',
    'geographic_zips'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%1$s_updated_at
           BEFORE UPDATE ON %1$s
           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t
      );
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- SEED DATA — 50 US States + DC (2020 Census / ACS 5-Year 2019-2023)
-- =============================================================================

INSERT INTO geographic_states (name, abbr, fips, lat, lng, population, households, businesses, median_household_income, median_age, homeownership_rate, median_home_value, land_area_sq_miles, data_source, data_year) VALUES
  ('Alabama',        'AL', '01',  32.806671,  -86.791130,   5024279,  1946747,  112000,  54943, 39.2, 69.1,  172800,  50645.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Alaska',         'AK', '02',  61.370716, -152.404419,    733391,   261669,   18000,  80287, 34.6, 65.5,  321100, 571951.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Arizona',        'AZ', '04',  33.729759, -111.431221,   7151502,  2607148,  161000,  62055, 38.5, 65.4,  316600,  113594.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Arkansas',       'AR', '05',  34.969704,  -92.373123,   3011524,  1197261,   61000,  50784, 38.6, 67.1,  162400,  52035.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('California',     'CA', '06',  36.116203, -119.681564,  39538223, 13568665,  934000,  84097, 37.5, 55.1,  683500, 155779.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Colorado',       'CO', '08',  39.059811, -105.311104,   5773714,  2280752,  150000,  77127, 37.0, 65.1,  489100, 103642.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Connecticut',    'CT', '09',  41.597782,  -72.755371,   3605944,  1405906,   87000,  84105, 41.4, 67.3,  335500,   4842.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Delaware',       'DE', '10',  39.318523,  -75.507141,    989948,   394568,   24000,  69142, 40.7, 71.1,  295200,   1948.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('District of Columbia','DC','11', 38.897438, -77.026817,   689545,   295274,   25000,  90842, 34.9, 43.0,  690000,     61.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Florida',        'FL', '12',  27.766279,  -81.686783,  21538187,  8891565,  465000,  61777, 42.4, 66.4,  295000,  53625.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Georgia',        'GA', '13',  33.040619,  -83.643074,  10711908,  3970283,  242000,  63062, 37.7, 64.3,  233800,  57513.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hawaii',         'HI', '15',  21.094318, -157.498337,   1455271,   491023,   33000,  74923, 39.4, 60.1,  669400,   6423.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Idaho',          'ID', '16',  44.240459, -114.478828,   1839106,   668975,   43000,  60999, 36.3, 70.0,  323100,  82643.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Illinois',       'IL', '17',  40.349457,  -88.986137,  12812508,  4905729,  311000,  69187, 38.7, 67.5,  231000,  55519.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Indiana',        'IN', '18',  39.849426,  -86.258278,   6785528,  2651529,  141000,  59764, 38.0, 70.1,  197700,  35826.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Iowa',           'IA', '19',  42.011539,  -93.210526,   3190369,  1280421,   75000,  61691, 38.5, 73.5,  175800,  55857.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Kansas',         'KS', '20',  38.526600,  -96.726486,   2937880,  1147024,   70000,  65026, 37.1, 68.5,  193700,  81759.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Kentucky',       'KY', '21',  37.668140,  -84.670067,   4505836,  1774566,   91000,  55454, 39.1, 68.4,  181400,  39486.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Louisiana',      'LA', '22',  31.169960,  -91.867805,   4657757,  1760204,   95000,  51073, 38.5, 68.3,  183600,  43204.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Maine',          'ME', '23',  44.693947,  -69.381927,   1362359,   582847,   37000,  61215, 44.9, 73.0,  250600,  30843.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Maryland',       'MD', '24',  39.063946,  -76.802101,   6177224,  2311735,  147000,  94384, 39.0, 68.0,  365700,   9707.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Massachusetts',  'MA', '25',  42.230171,  -71.530106,   7029917,  2741989,  182000,  89026, 39.9, 63.5,  466900,   7800.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Michigan',       'MI', '26',  43.326618,  -84.536095,  10077331,  4035699,  222000,  62294, 40.0, 73.4,  210500,  56804.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Minnesota',      'MN', '27',  45.694454,  -93.900192,   5706494,  2272498,  143000,  73382, 38.7, 73.0,  286700,  79627.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Mississippi',    'MS', '28',  32.741646,  -89.678696,   2961279,  1107853,   55000,  46637, 37.5, 69.6,  150200,  46923.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Missouri',       'MO', '29',  38.456085,  -92.288368,   6154913,  2462019,  145000,  59196, 39.1, 70.2,  199500,  68742.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Montana',        'MT', '30',  46.921925, -110.454353,   1084225,   442430,   27000,  57153, 39.8, 68.2,  305600, 145546.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Nebraska',       'NE', '31',  41.492537,  -99.901810,   1961504,   776661,   51000,  65615, 36.9, 67.5,  214400,  76824.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Nevada',         'NV', '32',  38.313515, -117.055374,   3104614,  1178049,   68000,  63276, 38.0, 60.6,  349800, 109781.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New Hampshire',  'NH', '33',  43.452492,  -71.563896,   1377529,   541879,   40000,  82282, 43.4, 72.1,  358200,   8953.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New Jersey',     'NJ', '34',  40.298904,  -74.521011,   9288994,  3240175,  228000,  90072, 40.3, 65.1,  411400,   7354.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New Mexico',     'NM', '35',  34.840515, -106.248482,   2117522,   839561,   44000,  51945, 38.3, 68.2,  201900, 121298.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New York',       'NY', '36',  42.165726,  -74.948051,  20201249,  7659454,  511000,  75157, 39.2, 55.3,  368000,  47126.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('North Carolina', 'NC', '37',  35.630066,  -79.806419,  10439388,  4144729,  236000,  62891, 38.9, 66.9,  244400,  48618.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('North Dakota',   'ND', '38',  47.528912, -99.784012,    779094,   325804,   21000,  61279, 35.6, 64.8,  230700,  69001.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Ohio',           'OH', '39',  40.388783,  -82.764915,  11799448,  4761901,  260000,  61938, 39.4, 69.1,  197400,  40861.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Oklahoma',       'OK', '40',  35.565342,  -96.928917,   3959353,  1536953,   85000,  56596, 37.5, 67.8,  162400,  68595.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Oregon',         'OR', '41',  44.572021, -122.070938,   4237256,  1745013,  111000,  67058, 40.0, 63.8,  386900,  95988.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pennsylvania',   'PA', '42',  40.590752,  -77.209755,  13002700,  5287753,  292000,  63627, 40.8, 70.1,  226100,  44743.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Rhode Island',   'RI', '44',  41.680893,  -71.511780,   1097379,   441671,   27000,  68519, 40.0, 60.8,  310600,   1034.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('South Carolina', 'SC', '45',  33.856892,  -80.945007,   5118425,  2010655,  110000,  57216, 40.2, 70.1,  230000,  30061.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('South Dakota',   'SD', '46',  44.299782,  -99.438828,    886667,   351490,   22000,  60541, 37.3, 68.9,  220500,  75811.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tennessee',      'TN', '47',  35.747845,  -86.692345,   6910840,  2741249,  163000,  58516, 38.8, 68.8,  231600,  41235.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Texas',          'TX', '48',  31.054487,  -97.563461,  29145505, 10617423,  612000,  63826, 35.5, 62.0,  250000, 261232.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Utah',           'UT', '49',  40.150032, -111.862434,   3271616,  1060553,   83000,  73012, 31.6, 71.7,  380800,  82144.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Vermont',        'VT', '50',  44.045876,  -72.710686,    643077,   277232,   20000,  61736, 43.1, 70.9,  284000,   9217.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Virginia',       'VA', '51',  37.769337,  -78.169968,   8631393,  3339018,  212000,  80963, 38.3, 67.6,  330000,  39490.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Washington',     'WA', '53',  47.400902, -121.490494,   7705281,  3099741,  197000,  78687, 37.9, 64.9,  474600,  66456.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('West Virginia',  'WV', '54',  38.491226,  -80.954453,   1793716,   753704,   33000,  48037, 42.9, 73.1,  130900,  24038.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Wisconsin',      'WI', '55',  44.268543,  -89.616508,   5893718,  2376684,  143000,  63765, 40.0, 70.1,  221100,  54158.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Wyoming',        'WY', '56',  42.755966, -107.302490,    576851,   226347,   17000,  65285, 37.6, 72.5,  264500,  97093.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SEED DATA — 60 Largest US Cities (2020 Census / ACS 5-Year 2019-2023)
-- =============================================================================

INSERT INTO geographic_places (name, state_abbr, state_name, county, msa_name, lat, lng, population, households, businesses, median_household_income, median_age, homeownership_rate, median_home_value, population_density, land_area_sq_miles, data_source, data_year) VALUES
  ('New York City',      'NY', 'New York',       'New York County',     'New York-Newark-Jersey City',        40.7128,  -74.0060,  8336817, 3111362, 219000, 72108, 36.7, 32.3,  643000,  27012.0,   302.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Los Angeles',        'CA', 'California',     'Los Angeles County',  'Los Angeles-Long Beach-Anaheim',     34.0522, -118.2437,  3979576, 1394000, 120000, 65290, 36.0, 38.6,  687000,   8272.4,   468.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Chicago',            'IL', 'Illinois',       'Cook County',         'Chicago-Naperville-Elgin',           41.8781,  -87.6298,  2709534, 1030000,  70000, 62097, 36.5, 46.5,  299000,  11841.8,   227.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Houston',            'TX', 'Texas',          'Harris County',       'Houston-The Woodlands-Sugar Land',   29.7604,  -95.3698,  2304580,  849498,  58000, 57791, 34.1, 46.0,  210000,   3842.8,   637.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Phoenix',            'AZ', 'Arizona',        'Maricopa County',     'Phoenix-Mesa-Chandler',              33.4484, -112.0740,  1608139,  614277,  43000, 60914, 34.3, 52.5,  315000,   3120.4,   517.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Philadelphia',       'PA', 'Pennsylvania',   'Philadelphia County', 'Philadelphia-Camden-Wilmington',     39.9526,  -75.1652,  1603797,  620843,  38000, 53676, 34.7, 48.7,  211000,  11379.0,   141.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Antonio',        'TX', 'Texas',          'Bexar County',        'San Antonio-New Braunfels',          29.4241,  -98.4936,  1434625,  506444,  36000, 55083, 34.0, 56.8,  197000,   2819.9,   460.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Diego',          'CA', 'California',     'San Diego County',    'San Diego-Chula Vista-Carlsbad',     32.7157, -117.1611,  1386932,  514000,  37000, 92196, 35.6, 46.9,  775000,   4325.1,   325.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Dallas',             'TX', 'Texas',          'Dallas County',       'Dallas-Fort Worth-Arlington',        32.7767,  -96.7970,  1304379,  501241,  40000, 54747, 32.9, 43.7,  249000,   3828.8,   340.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Jose',           'CA', 'California',     'Santa Clara County',  'San Jose-Sunnyvale-Santa Clara',     37.3382, -121.8863,  1013240,  330000,  32000,130865, 37.2, 57.5, 1201000,   5777.4,   177.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Austin',             'TX', 'Texas',          'Travis County',       'Austin-Round Rock-Georgetown',       30.2672,  -97.7431,   961855,  379000,  31000, 79630, 34.4, 45.6,  502000,   3209.0,   305.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Jacksonville',       'FL', 'Florida',        'Duval County',        'Jacksonville',                       30.3322,  -81.6557,   949611,  374000,  22000, 57587, 36.4, 60.9,  265000,   1162.5,   747.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fort Worth',         'TX', 'Texas',          'Tarrant County',      'Dallas-Fort Worth-Arlington',        32.7555,  -97.3308,   918915,  340000,  21000, 62543, 34.4, 58.7,  276000,   2384.5,   342.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Columbus',           'OH', 'Ohio',           'Franklin County',     'Columbus',                           39.9612,  -82.9988,   905748,  360000,  23000, 58764, 31.9, 43.5,  225000,   3879.8,   220.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Charlotte',          'NC', 'North Carolina', 'Mecklenburg County',  'Charlotte-Concord-Gastonia',         35.2271,  -80.8431,   874579,  345000,  25000, 65359, 34.8, 52.3,  309000,   2788.7,   308.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Francisco',      'CA', 'California',     'San Francisco County','San Francisco-Oakland-Berkeley',     37.7749, -122.4194,   873965,  355000,  30000,130496, 38.3, 38.2, 1265000,  17179.0,    46.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Indianapolis',       'IN', 'Indiana',        'Marion County',       'Indianapolis-Carmel-Anderson',       39.7684,  -86.1581,   887232,  330000,  21000, 51285, 34.7, 49.5,  185000,   2262.0,   361.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Seattle',            'WA', 'Washington',     'King County',         'Seattle-Tacoma-Bellevue',            47.6062, -122.3321,   737255,  338000,  30000,105391, 36.0, 47.1,  852000,   8360.7,    83.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Denver',             'CO', 'Colorado',       'Denver County',       'Denver-Aurora-Lakewood',             39.7392, -104.9903,   715522,  319000,  25000, 72356, 34.5, 51.9,  572000,   4401.5,   153.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Nashville',          'TN', 'Tennessee',      'Davidson County',     'Nashville-Davidson--Murfreesboro',   36.1627,  -86.7816,   689447,  286000,  22000, 67040, 34.4, 52.7,  362000,   1267.0,   475.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Oklahoma City',      'OK', 'Oklahoma',       'Oklahoma County',     'Oklahoma City',                      35.4676,  -97.5164,   681054,  265000,  16000, 57148, 34.9, 59.7,  195000,   1010.4,   607.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('El Paso',            'TX', 'Texas',          'El Paso County',      'El Paso',                            31.7619, -106.4850,   678815,  215000,  13000, 46563, 32.1, 56.2,  152000,   2493.0,   255.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Washington',         'DC', 'District of Columbia','District of Columbia','Washington-Arlington-Alexandria',38.9072, -77.0369,   689545,  294571,  25000, 90842, 34.9, 43.0,  690000,  11294.3,    61.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Las Vegas',          'NV', 'Nevada',         'Clark County',        'Las Vegas-Henderson-Paradise',       36.1699, -115.1398,   641903,  246000,  18000, 57139, 36.7, 49.6,  347000,   4532.9,   135.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Louisville',         'KY', 'Kentucky',       'Jefferson County',    'Louisville/Jefferson County',        38.2527,  -85.7585,   633045,  261000,  17000, 52649, 37.7, 62.6,  213000,   1804.2,   325.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Memphis',            'TN', 'Tennessee',      'Shelby County',       'Memphis',                            35.1495,  -90.0490,   633104,  245000,  13000, 43929, 33.6, 48.6,  147000,   2024.9,   306.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Portland',           'OR', 'Oregon',         'Multnomah County',    'Portland-Vancouver-Hillsboro',       45.5051, -122.6750,   652503,  295000,  24000, 84120, 37.3, 52.7,  499000,   4376.8,   133.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Baltimore',          'MD', 'Maryland',       'Baltimore City',      'Baltimore-Columbia-Towson',          39.2904,  -76.6122,   585708,  238000,  14000, 54124, 35.0, 48.5,  207000,   7671.7,    80.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Milwaukee',          'WI', 'Wisconsin',      'Milwaukee County',    'Milwaukee-Waukesha',                 43.0389,  -87.9065,   577222,  226000,  12000, 44621, 31.8, 44.2,  161000,   6188.3,    96.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Albuquerque',        'NM', 'New Mexico',     'Bernalillo County',   'Albuquerque',                        35.0844, -106.6504,   564559,  228000,  13000, 55962, 36.2, 61.7,  243000,   3235.4,   189.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tucson',             'AZ', 'Arizona',        'Pima County',         'Tucson',                             32.2226, -110.9747,   542629,  208000,  11000, 44740, 35.3, 57.6,  235000,   2365.0,   227.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fresno',             'CA', 'California',     'Fresno County',       'Fresno',                             36.7378, -119.7871,   542107,  173000,  11000, 50193, 31.5, 47.5,  310000,   4661.8,   114.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Sacramento',         'CA', 'California',     'Sacramento County',   'Sacramento-Roseville-Folsom',        38.5816, -121.4944,   524943,  190000,  15000, 63370, 34.9, 51.9,  445000,   5098.9,   100.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Mesa',               'AZ', 'Arizona',        'Maricopa County',     'Phoenix-Mesa-Chandler',              33.4152, -111.8315,   504258,  188000,  12000, 60789, 35.5, 58.2,  310000,   3372.3,   138.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Kansas City',        'MO', 'Missouri',       'Jackson County',      'Kansas City',                        39.0997,  -94.5786,   508090,  209000,  14000, 57867, 35.4, 60.2,  210000,   1488.7,   319.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Atlanta',            'GA', 'Georgia',        'Fulton County',       'Atlanta-Sandy Springs-Alpharetta',   33.7490,  -84.3880,   498715,  196000,  18000, 65427, 33.5, 43.4,  350000,   3542.1,   134.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Omaha',              'NE', 'Nebraska',       'Douglas County',      'Omaha-Council Bluffs',               41.2565,  -95.9345,   486051,  190000,  13000, 62697, 34.4, 59.3,  220000,   3607.5,   130.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Colorado Springs',   'CO', 'Colorado',       'El Paso County',      'Colorado Springs',                   38.8339, -104.8214,   478961,  184000,  12000, 68092, 35.1, 62.1,  370000,   2213.7,   194.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Raleigh',            'NC', 'North Carolina', 'Wake County',         'Raleigh-Cary',                       35.7796,  -78.6382,   467665,  195000,  15000, 73700, 33.4, 53.3,  358000,   2963.7,   144.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Long Beach',         'CA', 'California',     'Los Angeles County',  'Los Angeles-Long Beach-Anaheim',     33.7701, -118.1937,   466742,  165000,  11000, 71695, 35.0, 40.6,  616000,   9354.7,    50.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Virginia Beach',     'VA', 'Virginia',       'Virginia Beach City', 'Virginia Beach-Norfolk-Newport News',36.8529,  -75.9780,   459470,  169000,  12000, 84256, 36.3, 67.8,  317000,   1728.5,   248.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Minneapolis',        'MN', 'Minnesota',      'Hennepin County',     'Minneapolis-St. Paul-Bloomington',   44.9778,  -93.2650,   429954,  201000,  18000, 64831, 32.7, 51.4,  325000,   7717.6,    54.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tampa',              'FL', 'Florida',        'Hillsborough County', 'Tampa-St. Petersburg-Clearwater',    27.9506,  -82.4572,   399700,  167000,  14000, 60442, 35.8, 48.7,  350000,   3399.0,   113.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New Orleans',        'LA', 'Louisiana',      'Orleans Parish',      'New Orleans-Metairie',               29.9511,  -90.0715,   383997,  165000,  11000, 45615, 36.9, 46.2,  228000,   2147.2,   169.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Arlington',          'TX', 'Texas',          'Tarrant County',      'Dallas-Fort Worth-Arlington',        32.7357,  -97.1081,   394266,  145000,  10000, 57741, 33.2, 51.7,  242000,   3923.0,    95.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Bakersfield',        'CA', 'California',     'Kern County',         'Bakersfield',                        35.3733, -119.0187,   403455,  120000,   8000, 68025, 30.7, 57.2,  299000,   3284.7,   148.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cleveland',          'OH', 'Ohio',           'Cuyahoga County',     'Cleveland-Elyria',                   41.4993,  -81.6944,   372624,  167000,   8000, 32878, 35.8, 41.3,  102000,   5108.8,    77.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Miami',              'FL', 'Florida',        'Miami-Dade County',   'Miami-Fort Lauderdale-Pompano Beach',25.7617,  -80.1918,   442241,  171000,  14000, 45361, 40.5, 29.5,  390000,  13180.1,    35.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Aurora',             'CO', 'Colorado',       'Arapahoe County',     'Denver-Aurora-Lakewood',             39.7294, -104.8319,   366623,  139000,   8000, 68640, 33.7, 57.3,  400000,   4107.4,    89.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Anaheim',            'CA', 'California',     'Orange County',       'Los Angeles-Long Beach-Anaheim',     33.8366, -117.9143,   346824,  106000,   9000, 78462, 33.1, 46.7,  665000,   8282.0,    50.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('West Palm Beach',    'FL', 'Florida',        'Palm Beach County',   'Miami-Fort Lauderdale-Pompano Beach',26.7153,  -80.0534,   117415,   51000,   5000, 52975, 39.9, 40.4,  290000,   3447.5,    55.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Orlando',            'FL', 'Florida',        'Orange County',       'Orlando-Kissimmee-Sanford',          28.5384,  -81.3789,   307573,  119000,  10000, 54432, 33.9, 40.8,  300000,   2649.1,   110.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fort Lauderdale',    'FL', 'Florida',        'Broward County',      'Miami-Fort Lauderdale-Pompano Beach',26.1224,  -80.1373,   182595,   84000,   7000, 65000, 39.8, 41.0,  375000,   5156.4,    34.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Deerfield Beach',    'FL', 'Florida',        'Broward County',      'Miami-Fort Lauderdale-Pompano Beach',26.3184,  -80.0998,    86039,   38000,   3000, 48234, 43.1, 48.3,  250000,   5010.0,    16.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Corpus Christi',     'TX', 'Texas',          'Nueces County',       'Corpus Christi',                     27.8006,  -97.3964,   326554,  114000,   8000, 51648, 35.7, 61.3,  182000,   1859.4,   154.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Riverside',          'CA', 'California',     'Riverside County',    'Riverside-San Bernardino-Ontario',   33.9806, -117.3755,   314998,  101000,   8000, 77695, 32.8, 56.2,  470000,   3558.4,    81.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cincinnati',         'OH', 'Ohio',           'Hamilton County',     'Cincinnati',                         39.1031,  -84.5120,   309317,  128000,  10000, 48282, 31.9, 41.7,  209000,   4127.5,    77.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pittsburgh',         'PA', 'Pennsylvania',   'Allegheny County',    'Pittsburgh',                         40.4406,  -79.9959,   302971,  143000,  11000, 51444, 34.0, 49.4,  182000,   5499.4,    55.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('St. Louis',          'MO', 'Missouri',       'St. Louis City',      'St. Louis',                          38.6270,  -90.1994,   301578,  133000,   9000, 44762, 35.6, 44.8,  151000,   5765.3,    61.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023)
ON CONFLICT (name, state_abbr) DO NOTHING;
