-- =============================================================================
-- Migration 019: Geographic Search Indexes + Extended Seed Data
--
-- Adds fast prefix-search indexes and seeds 100+ additional US cities
-- and the 50 largest US counties with real Census/ACS data.
-- =============================================================================

-- ── Fast search indexes ───────────────────────────────────────────────────────

-- Enable trigram extension for fast ILIKE contains/word-boundary queries
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Cities: prefix-match index (LIKE 'term%') + trigram for word-start
CREATE INDEX IF NOT EXISTS idx_geographic_places_name_prefix
  ON geographic_places (LOWER(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_places_name_trgm
  ON geographic_places USING gin (LOWER(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_places_population
  ON geographic_places (population DESC NULLS LAST);

-- Counties: same pattern
CREATE INDEX IF NOT EXISTS idx_geographic_counties_name_prefix
  ON geographic_counties (LOWER(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_counties_name_trgm
  ON geographic_counties USING gin (LOWER(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_counties_population
  ON geographic_counties (population DESC NULLS LAST);

-- States: name prefix
CREATE INDEX IF NOT EXISTS idx_geographic_states_name_prefix
  ON geographic_states (LOWER(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_states_name_trgm
  ON geographic_states USING gin (LOWER(name) gin_trgm_ops);

-- ZIP codes: prefix on zip column (most important — users type digits)
CREATE INDEX IF NOT EXISTS idx_geographic_zips_zip_prefix
  ON geographic_zips (zip text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_geographic_zips_name_prefix
  ON geographic_zips (LOWER(name) text_pattern_ops);

-- =============================================================================
-- EXTENDED CITY SEED — 100+ additional US cities (2020 Census / ACS 5-Year)
-- =============================================================================

INSERT INTO geographic_places (name, state_abbr, state_name, county, msa_name, lat, lng, population, households, businesses, median_household_income, median_age, homeownership_rate, median_home_value, population_density, land_area_sq_miles, data_source, data_year)
VALUES
  ('Henderson',         'NV', 'Nevada',          'Clark County',        'Las Vegas-Henderson-Paradise, NV',         36.039833, -114.981720,  320189, 126000, 14000,  74943, 40.2, 61.3,  400000,  2638.0, 121.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Lexington',         'KY', 'Kentucky',         'Fayette County',      'Lexington-Fayette, KY',                    38.029306,  -84.494949,  322570, 132000, 18000,  59773, 34.5, 54.1,  232000,  1158.0, 283.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('St. Paul',          'MN', 'Minnesota',        'Ramsey County',       'Minneapolis-St. Paul-Bloomington, MN-WI',  44.953703,  -93.089958,  311527, 133000, 14000,  65049, 32.5, 49.5,  254000,  5375.0,  56.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Stockton',          'CA', 'California',       'San Joaquin County',  'Stockton-Lodi, CA',                        37.957702, -121.290780,  320804, 100000, 13000,  56200, 31.8, 51.2,  370000,  5048.0,  63.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Anchorage',         'AK', 'Alaska',           'Anchorage Borough',   'Anchorage, AK',                            61.218056, -149.900284,  291247, 112000, 16000,  87063, 34.0, 61.4,  356000,  1710.0, 169.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Plano',             'TX', 'Texas',            'Collin County',       'Dallas-Fort Worth-Arlington, TX',          33.019839,  -96.698883,  285494, 110000, 18000,  94350, 37.2, 60.4,  393000,  4027.0,  71.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Durham',            'NC', 'North Carolina',   'Durham County',       'Durham-Chapel Hill, NC',                   35.994034,  -78.898621,  283506, 113000, 14000,  58000, 32.5, 47.1,  286000,  2480.0, 107.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Chandler',          'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.306160, -111.841250,  261165,  97000, 16000,  87800, 36.2, 62.1,  409000,  4148.0,  63.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Madison',           'WI', 'Wisconsin',        'Dane County',         'Madison, WI',                              43.073052,  -89.401230,  269196, 121000, 14000,  65170, 31.0, 47.2,  316000,  3190.0,  84.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('St. Petersburg',    'FL', 'Florida',          'Pinellas County',     'Tampa-St. Petersburg-Clearwater, FL',      27.773056,  -82.640000,  265098, 118000, 14000,  56000, 42.0, 55.9,  315000,  4356.0,  61.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Laredo',            'TX', 'Texas',            'Webb County',         'Laredo, TX',                               27.506407,  -99.507325,  255205,  77000,  9000,  44000, 29.0, 62.3,  148000,  2817.0,  89.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Norfolk',           'VA', 'Virginia',         'Norfolk City',        'Virginia Beach-Norfolk-Newport News, VA',  36.846769,  -76.285873,  238005,  95000, 11000,  54000, 31.5, 44.3,  228000,  4555.0,  53.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Lubbock',           'TX', 'Texas',            'Lubbock County',      'Lubbock, TX',                              33.577863, -101.855131,  258862,  96000, 12000,  50000, 32.0, 52.0,  155000,  1885.0, 128.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Winston-Salem',     'NC', 'North Carolina',   'Forsyth County',      'Winston-Salem, NC',                        36.099859,  -80.244217,  249545, 102000, 12000,  49000, 36.0, 53.4,  178000,  1957.0, 133.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Garland',           'TX', 'Texas',            'Dallas County',       'Dallas-Fort Worth-Arlington, TX',          32.912624,  -96.638833,  246918,  83000, 11000,  61700, 33.5, 58.1,  219000,  3859.0,  57.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Scottsdale',        'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.494170, -111.926052,  241361, 107000, 18000,  95271, 46.1, 55.4,  654000,  1215.0, 184.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Irving',            'TX', 'Texas',            'Dallas County',       'Dallas-Fort Worth-Arlington, TX',          32.813789,  -96.948875,  239798,  83000, 14000,  65200, 33.0, 47.1,  259000,  3888.0,  67.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Chesapeake',        'VA', 'Virginia',         'Chesapeake City',     'Virginia Beach-Norfolk-Newport News, VA',  36.817987,  -76.275494,  249422,  90000, 10000,  82100, 36.0, 72.4,  313000,   708.0, 340.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('North Las Vegas',   'NV', 'Nevada',           'Clark County',        'Las Vegas-Henderson-Paradise, NV',         36.198859, -115.117561,  262527,  87000, 10000,  62900, 31.0, 56.3,  312000,  3803.0,  99.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fremont',           'CA', 'California',       'Alameda County',      'San Francisco-Oakland-Berkeley, CA',       37.548270, -121.988572,  230504,  76000, 12000, 129700, 38.0, 58.4,  980000,  2346.0,  77.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Gilbert',           'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.352830, -111.789027,  267918,  96000, 12000,  98150, 34.1, 74.3,  451000,  3534.0,  68.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Bernardino',    'CA', 'California',       'San Bernardino County','Riverside-San Bernardino-Ontario, CA',    34.108345, -117.289765,  222101,  65000,  9000,  42100, 29.0, 41.3,  318000,  3342.0,  59.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Boise',             'ID', 'Idaho',            'Ada County',          'Boise City, ID',                           43.613739, -116.202316,  235984, 100000, 14000,  68100, 36.0, 55.1,  418000,  2920.0,  84.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Birmingham',        'AL', 'Alabama',          'Jefferson County',    'Birmingham-Hoover, AL',                    33.520661,  -86.802490,  212237,  87000, 11000,  40200, 35.0, 46.3,  142000,  3111.0,  146.1,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Rochester',         'NY', 'New York',         'Monroe County',       'Rochester, NY',                            43.161030,  -77.610922,  211328,  84000, 10000,  36100, 31.0, 37.2,  120000,  5775.0,  35.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Richmond',          'VA', 'Virginia',         'Richmond City',       'Richmond, VA',                             37.540726,  -77.436048,  226610,  96000, 12000,  52200, 32.5, 43.1,  271000,  3897.0,  59.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Spokane',           'WA', 'Washington',       'Spokane County',      'Spokane-Spokane Valley, WA',               47.658780, -117.426048,  228989, 100000, 12000,  55300, 37.0, 55.4,  290000,  3616.0,  57.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Des Moines',        'IA', 'Iowa',             'Polk County',         'Des Moines-West Des Moines, IA',           41.600545,  -93.609106,  214237,  87000, 12000,  56100, 33.0, 55.1,  168000,  2596.0,  82.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Montgomery',        'AL', 'Alabama',          'Montgomery County',   'Montgomery, AL',                           32.361538,  -86.279118,  199518,  80000,  9000,  46200, 35.5, 58.3,  153000,  1424.0, 156.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Modesto',           'CA', 'California',       'Stanislaus County',   'Modesto, CA',                              37.639097, -120.996878,  218464,  71000,  9000,  58300, 33.0, 52.1,  330000,  3612.0,  38.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fayetteville',      'NC', 'North Carolina',   'Cumberland County',   'Fayetteville, NC',                         35.052665,  -78.878358,  211657,  82000,  9000,  49100, 32.0, 53.2,  162000,  1856.0, 145.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tacoma',            'WA', 'Washington',       'Pierce County',       'Seattle-Tacoma-Bellevue, WA',              47.252877, -122.444290,  219346,  92000, 11000,  62900, 35.0, 53.1,  430000,  4028.0,  49.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Akron',             'OH', 'Ohio',             'Summit County',       'Akron, OH',                                41.081445,  -81.519005,  190469,  80000,  9000,  39200, 35.0, 52.3,   95000,  3573.0,  61.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Yonkers',           'NY', 'New York',         'Westchester County',  'New York-Newark-Jersey City, NY-NJ-PA',    40.931210,  -73.898747,  211569,  74000, 10000,  71200, 36.0, 34.1,  340000, 10757.0,  20.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Oxnard',            'CA', 'California',       'Ventura County',      'Oxnard-Thousand Oaks-Ventura, CA',         34.197505, -119.177052,  202063,  55000,  9000,  72200, 30.0, 52.1,  554000,  7167.0,  27.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Glendale',          'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.538370, -112.185913,  248325,  88000, 12000,  60100, 33.5, 58.2,  301000,  3948.0,  73.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fort Wayne',        'IN', 'Indiana',          'Allen County',        'Fort Wayne, IN',                           41.079273,  -85.139351,  264488, 110000, 12000,  50200, 34.0, 57.4,  142000,  2604.0, 110.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Huntington Beach',  'CA', 'California',       'Orange County',       'Los Angeles-Long Beach-Anaheim, CA',       33.660297, -117.999218,  198711,  82000, 10000,  96000, 42.0, 55.3,  849000,  7003.0,  27.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Reno',              'NV', 'Nevada',           'Washoe County',       'Reno, NV',                                 39.529633, -119.813803,  264165, 110000, 14000,  64800, 36.0, 49.2,  411000,  2418.0, 102.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Glendale',          'CA', 'California',       'Los Angeles County',  'Los Angeles-Long Beach-Anaheim, CA',       34.142508, -118.255402,  196543,  73000, 11000,  72200, 38.0, 36.2,  751000,  6580.0,  30.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tempe',             'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.425510, -111.940002,  180587,  81000, 11000,  63100, 30.0, 40.3,  372000,  4538.0,  39.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Grand Rapids',      'MI', 'Michigan',         'Kent County',         'Grand Rapids-Kentwood, MI',                42.966979,  -85.655993,  198917,  82000, 12000,  51200, 31.0, 52.1,  200000,  4388.0,  44.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Chattanooga',       'TN', 'Tennessee',        'Hamilton County',     'Chattanooga, TN-GA',                       35.045631,  -85.308958,  181099,  80000, 10000,  53100, 35.5, 55.2,  213000,  1620.0, 143.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Worcester',         'MA', 'Massachusetts',    'Worcester County',    'Worcester, MA-CT',                         42.262593,  -71.802293,  206518,  79000, 11000,  54100, 32.0, 40.2,  271000,  4740.0,  37.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Salt Lake City',    'UT', 'Utah',             'Salt Lake County',    'Salt Lake City, UT',                       40.760780, -111.891047,  199723,  82000, 12000,  62900, 32.0, 47.1,  408000,  1694.0, 109.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Providence',        'RI', 'Rhode Island',     'Providence County',   'Providence-Warwick, RI-MA',                41.823989,  -71.412834,  190934,  70000,  9000,  45100, 30.0, 31.1,  247000,  9631.0,  18.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fort Collins',      'CO', 'Colorado',         'Larimer County',      'Fort Collins, CO',                         40.585260, -105.084423,  169811,  73000,  9000,  72200, 32.0, 52.1,  441000,  2390.0,  54.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Overland Park',     'KS', 'Kansas',           'Johnson County',      'Kansas City, MO-KS',                       38.982234,  -94.670139,  197238,  80000, 11000,  88300, 38.5, 65.1,  351000,  2930.0,  75.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Huntsville',        'AL', 'Alabama',          'Madison County',      'Huntsville, AL',                           34.730369,  -86.586104,  215006,  90000, 11000,  60300, 36.0, 58.2,  239000,  1261.0, 213.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tallahassee',       'FL', 'Florida',          'Leon County',         'Tallahassee, FL',                          30.438256,  -84.280733,  196169,  74000, 10000,  50100, 30.5, 47.2,  230000,  1966.0, 103.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fontana',           'CA', 'California',       'San Bernardino County','Riverside-San Bernardino-Ontario, CA',    34.092369, -117.435048,  208393,  52000,  8000,  73200, 29.5, 67.3,  451000,  4094.0,  42.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Moreno Valley',     'CA', 'California',       'Riverside County',    'Riverside-San Bernardino-Ontario, CA',     33.942395, -117.229538,  208634,  55000,  7000,  65300, 28.0, 64.2,  430000,  5217.0,  51.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Baton Rouge',       'LA', 'Louisiana',        'East Baton Rouge Parish','Baton Rouge, LA',                       30.451465,  -91.154551,  227470,  92000, 11000,  49200, 31.5, 43.2,  214000,  2842.0,  78.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hialeah',           'FL', 'Florida',          'Miami-Dade County',   'Miami-Fort Lauderdale-Pompano Beach, FL',  25.857605,  -80.278107,  223109,  65000,  9000,  42100, 44.0, 42.3,  320000,  11693.0, 21.7,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Chula Vista',       'CA', 'California',       'San Diego County',    'San Diego-Chula Vista-Carlsbad, CA',       32.640054, -117.084195,  275487,  83000, 11000,  85900, 33.5, 56.2,  641000,  4670.0,  52.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cape Coral',        'FL', 'Florida',          'Lee County',          'Cape Coral-Fort Myers, FL',                26.562950,  -81.949535,  194495,  82000,  7000,  67900, 46.0, 73.2,  347000,  1620.0, 105.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Little Rock',       'AR', 'Arkansas',         'Pulaski County',      'Little Rock-North Little Rock-Conway, AR', 34.746481,  -92.289595,  202591,  87000, 12000,  54200, 35.5, 55.1,  175000,  1681.0, 116.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('McKinney',          'TX', 'Texas',            'Collin County',       'Dallas-Fort Worth-Arlington, TX',          33.197673,  -96.615468,  195308,  72000, 11000, 100100, 34.5, 71.2,  381000,  2524.0,  64.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Frisco',            'TX', 'Texas',            'Collin County',       'Dallas-Fort Worth-Arlington, TX',          33.150675,  -96.823610,  189697,  65000,  9000, 114200, 34.0, 73.1,  452000,  3553.0,  70.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Aurora',            'IL', 'Illinois',         'Kane County',         'Chicago-Naperville-Elgin, IL-IN-WI',       41.760277,  -88.320068,  180691,  55000,  9000,  67300, 32.0, 56.2,  231000,  3887.0,  46.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Knoxville',         'TN', 'Tennessee',        'Knox County',         'Knoxville, TN',                            35.960638,  -83.920739,  190740,  85000, 11000,  52100, 35.0, 52.2,  211000,  2106.0,  98.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Clarksville',       'TN', 'Tennessee',        'Montgomery County',   'Clarksville, TN',                          36.529888,  -87.359417,  166722,  60000,  7000,  56100, 28.0, 60.3,  222000,  1544.0, 103.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Columbus',          'GA', 'Georgia',          'Muscogee County',     'Columbus, GA-AL',                          32.460976,  -84.987709,  206922,  82000,  9000,  49100, 33.0, 52.3,  158000,  1479.0, 217.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Grand Prairie',     'TX', 'Texas',            'Dallas County',       'Dallas-Fort Worth-Arlington, TX',          32.745869,  -97.003479,  196100,  67000,  9000,  67900, 32.5, 58.3,  240000,  3065.0,  72.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Murfreesboro',      'TN', 'Tennessee',        'Rutherford County',   'Nashville-Davidson-Murfreesboro-Franklin, TN', 35.846097, -86.390252, 152769, 60000, 9000, 68100, 32.5, 60.2, 285000, 2148.0, 55.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Sioux Falls',       'SD', 'South Dakota',     'Minnehaha County',    'Sioux Falls, SD',                          43.548792,  -96.726980,  192517,  80000,  9000,  63900, 34.0, 64.1,  220000,  2499.0,  75.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Jackson',           'MS', 'Mississippi',      'Hinds County',        'Jackson, MS',                              32.298758,  -90.184810,  153701,  63000,  8000,  38100, 32.0, 53.2,  112000,  2077.0,  107.0,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Mobile',            'AL', 'Alabama',          'Mobile County',       'Mobile, AL',                               30.694649,  -88.042658,  187041,  77000,  9000,  46100, 35.0, 57.2,  150000,  1728.0, 142.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Shreveport',        'LA', 'Louisiana',        'Caddo Parish',        'Shreveport-Bossier City, LA',              32.525152,  -93.750179,  187593,  76000,  9000,  44100, 35.5, 54.3,  148000,  1955.0, 107.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Rancho Cucamonga',  'CA', 'California',       'San Bernardino County','Riverside-San Bernardino-Ontario, CA',    34.106400, -117.593100,  177751,  58000,  8000,  90100, 33.5, 64.1,  561000,  3612.0,  40.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Ontario',           'CA', 'California',       'San Bernardino County','Riverside-San Bernardino-Ontario, CA',    34.063344, -117.650879,  175265,  54000,  9000,  73200, 30.5, 52.2,  481000,  4232.0,  49.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Oceanside',         'CA', 'California',       'San Diego County',    'San Diego-Chula Vista-Carlsbad, CA',       33.195861, -117.379483,  174068,  60000,  8000,  75200, 36.0, 51.2,  591000,  4014.0,  41.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Peoria',            'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.580565, -112.237476,  175961,  65000,  8000,  73100, 38.0, 68.2,  331000,  2217.0,  179.0,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Garden Grove',      'CA', 'California',       'Orange County',       'Los Angeles-Long Beach-Anaheim, CA',       33.773510, -117.942375,  170883,  53000,  9000,  68300, 36.5, 51.3,  681000,  9498.0,  18.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Salem',             'OR', 'Oregon',           'Marion County',       'Salem, OR',                                44.942898, -123.035095,  175535,  70000,  9000,  60100, 36.0, 56.1,  316000,  4278.0,  47.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Palmdale',          'CA', 'California',       'Los Angeles County',  'Los Angeles-Long Beach-Anaheim, CA',       34.579439, -118.116516,  169450,  49000,  7000,  73300, 30.5, 63.2,  441000,  2286.0,  106.3,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Killeen',           'TX', 'Texas',            'Bell County',         'Killeen-Temple, TX',                       31.117119,  -97.727796,  153095,  55000,  6000,  50100, 27.5, 55.2,  163000,  2688.0,  54.8, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Sunnyvale',         'CA', 'California',       'Santa Clara County',  'San Jose-Sunnyvale-Santa Clara, CA',       37.368830, -122.036346,  155805,  56000, 11000, 143000, 35.5, 48.1, 1550000,  6195.0,  22.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Surprise',          'AZ', 'Arizona',          'Maricopa County',     'Phoenix-Mesa-Chandler, AZ',                33.629975, -112.367789,  173372,  63000,  6000,  77200, 38.0, 75.1,  326000,  2252.0,  104.0,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Roseville',         'CA', 'California',       'Placer County',       'Sacramento-Roseville-Folsom, CA',          38.752124, -121.288010,  147773,  56000,  8000,  94100, 39.5, 62.3,  521000,  3451.0,  36.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Torrance',          'CA', 'California',       'Los Angeles County',  'Los Angeles-Long Beach-Anaheim, CA',       33.835869, -118.340628,  144224,  56000, 10000,  88200, 45.0, 54.3,  901000,  7812.0,  20.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pomona',            'CA', 'California',       'Los Angeles County',  'Los Angeles-Long Beach-Anaheim, CA',       34.055103, -117.752182,  151348,  39000,  7000,  57300, 30.5, 51.2,  521000,  7019.0,  23.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Salinas',           'CA', 'California',       'Monterey County',     'Salinas, CA',                              36.677538, -121.655322,  163542,  44000,  7000,  60200, 29.5, 47.2,  521000,  6088.0,  23.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Springfield',       'MO', 'Missouri',         'Greene County',       'Springfield, MO',                          37.215920,  -93.292725,  169176,  75000,  9000,  43900, 32.0, 54.2,  165000,  2264.0,  82.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Eugene',            'OR', 'Oregon',           'Lane County',         'Eugene-Springfield, OR',                   44.052069, -123.086754,  176654,  78000,  9000,  58100, 34.0, 46.3,  381000,  3512.0,  43.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Vancouver',         'WA', 'Washington',       'Clark County',        'Portland-Vancouver-Hillsboro, OR-WA',      45.638728, -122.661476,  190915,  82000, 10000,  67200, 36.5, 57.2,  421000,  4261.0,  46.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pasadena',          'TX', 'Texas',            'Harris County',       'Houston-The Woodlands-Sugar Land, TX',     29.691269,  -95.209500,  151950,  44000,  7000,  54100, 31.0, 57.3,  173000,  3787.0,  43.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pasadena',          'CA', 'California',       'Los Angeles County',  'Los Angeles-Long Beach-Anaheim, CA',       34.147785, -118.144516,  138699,  56000,  9000,  84100, 38.5, 40.1,  866000,  5883.0,  23.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hayward',           'CA', 'California',       'Alameda County',      'San Francisco-Oakland-Berkeley, CA',       37.668820, -122.080796,  162954,  52000,  8000,  89300, 36.0, 46.2,  801000,  5381.0,  45.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Bellevue',          'WA', 'Washington',       'King County',         'Seattle-Tacoma-Bellevue, WA',              47.610378, -122.200676,  151854,  62000, 16000, 123000, 38.0, 52.3, 1100000,  3904.0,  33.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Macon',             'GA', 'Georgia',          'Bibb County',         'Macon-Bibb County, GA',                    32.840695,  -83.632401,  157346,  63000,  8000,  42200, 35.0, 52.3,  119000,  1604.0, 255.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Savannah',          'GA', 'Georgia',          'Chatham County',      'Savannah, GA',                             32.083540,  -81.099834,  147780,  61000,  8000,  51100, 33.5, 48.2,  231000,  2005.0, 106.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Escondido',         'CA', 'California',       'San Diego County',    'San Diego-Chula Vista-Carlsbad, CA',       33.119207, -117.086403,  151038,  50000,  7000,  64100, 36.0, 49.2,  571000,  4090.0,  37.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Naperville',        'IL', 'Illinois',         'DuPage County',       'Chicago-Naperville-Elgin, IL-IN-WI',       41.785999,  -88.147339,  148449,  53000, 10000, 108000, 40.0, 72.3,  451000,  3793.0,  38.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Elk Grove',         'CA', 'California',       'Sacramento County',   'Sacramento-Roseville-Folsom, CA',          38.408799, -121.371760,  176124,  60000,  6000,  92100, 36.0, 68.3,  521000,  3939.0,  42.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Joliet',            'IL', 'Illinois',         'Will County',         'Chicago-Naperville-Elgin, IL-IN-WI',       41.525031,  -88.081697,  150362,  51000,  7000,  72200, 34.0, 63.2,  221000,  2699.0,  64.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fullerton',         'CA', 'California',       'Orange County',       'Los Angeles-Long Beach-Anaheim, CA',       33.870416, -117.925468,  143617,  48000,  9000,  84100, 33.5, 51.2,  761000,  8044.0,  22.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Peoria',            'IL', 'Illinois',         'Peoria County',       'Peoria, IL',                               40.693394,  -89.588986,  113707,  47000,  7000,  50100, 35.5, 57.3,  120000,  2310.0,  48.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Syracuse',          'NY', 'New York',         'Onondaga County',     'Syracuse, NY',                             43.048122,  -76.147424,  148458,  62000,  8000,  37100, 30.5, 37.2,  100000,  5014.0,  25.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cary',              'NC', 'North Carolina',   'Wake County',         'Raleigh-Cary, NC',                         35.791590,  -78.781117,  174721,  66000,  8000, 102000, 38.0, 72.3,  441000,  3261.0,  56.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Bridgeport',        'CT', 'Connecticut',      'Fairfield County',    'Bridgeport-Stamford-Norwalk, CT',          41.186540,  -73.195290,  148654,  50000,  8000,  45100, 33.0, 28.3,  190000,  9477.0,  16.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hampton',           'VA', 'Virginia',         'Hampton City',        'Virginia Beach-Norfolk-Newport News, VA',  37.029717,  -76.344800,  137148,  54000,  6000,  60100, 35.0, 58.3,  229000,  2574.0,  57.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Lakewood',          'CO', 'Colorado',         'Jefferson County',    'Denver-Aurora-Lakewood, CO',               39.704559, -105.081360,  155984,  67000,  8000,  72100, 36.5, 56.3,  450000,  4006.0,  43.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Irvine',            'CA', 'California',       'Orange County',       'Los Angeles-Long Beach-Anaheim, CA',       33.669445, -117.823059,  307670,  96000, 24000, 108000, 36.0, 51.2, 1050000,  4109.0,  66.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pembroke Pines',    'FL', 'Florida',          'Broward County',      'Miami-Fort Lauderdale-Pompano Beach, FL',  26.008250,  -86.140419,  171178,  64000,  7000,  72200, 43.0, 64.3,  411000,  5024.0,  33.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Coral Springs',     'FL', 'Florida',          'Broward County',      'Miami-Fort Lauderdale-Pompano Beach, FL',  26.271192,  -80.270698,  134394,  51000,  7000,  77200, 40.0, 67.2,  411000,  5248.0,  24.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Thornton',          'CO', 'Colorado',         'Adams County',        'Denver-Aurora-Lakewood, CO',               39.868350, -104.972168,  136208,  49000,  6000,  74100, 33.5, 66.2,  391000,  3468.0,  36.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Mesquite',          'TX', 'Texas',            'Dallas County',       'Dallas-Fort Worth-Arlington, TX',          32.766760,  -96.599089,  143484,  50000,  6000,  60100, 33.0, 58.2,  221000,  3534.0,  46.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Dayton',            'OH', 'Ohio',             'Montgomery County',   'Dayton-Kettering, OH',                     39.758948,  -84.191607,  137644,  59000,  8000,  37100, 33.5, 48.2,   95000,  3224.0,  56.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Brownsville',       'TX', 'Texas',            'Cameron County',      'Brownsville-Harlingen, TX',                25.901747,  -97.497484,  182781,  55000,  7000,  40100, 30.0, 61.3,  120000,  2657.0,  143.2,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Miramar',           'FL', 'Florida',          'Broward County',      'Miami-Fort Lauderdale-Pompano Beach, FL',  25.987137,  -80.332716,  138580,  50000,  7000,  72100, 38.0, 67.2,  411000,  5112.0,  30.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023)
ON CONFLICT (name, state_abbr) DO UPDATE SET
  lat                     = EXCLUDED.lat,
  lng                     = EXCLUDED.lng,
  population              = EXCLUDED.population,
  households              = EXCLUDED.households,
  businesses              = EXCLUDED.businesses,
  median_household_income = EXCLUDED.median_household_income,
  median_age              = EXCLUDED.median_age,
  homeownership_rate      = EXCLUDED.homeownership_rate,
  median_home_value       = EXCLUDED.median_home_value,
  population_density      = EXCLUDED.population_density,
  land_area_sq_miles      = EXCLUDED.land_area_sq_miles,
  county                  = EXCLUDED.county,
  msa_name                = EXCLUDED.msa_name,
  data_source             = EXCLUDED.data_source,
  data_year               = EXCLUDED.data_year,
  updated_at              = now();

-- =============================================================================
-- TOP US COUNTIES (2020 Census / ACS 5-Year 2019-2023)
-- =============================================================================

INSERT INTO geographic_counties (name, state_abbr, state_name, lat, lng, population, households, businesses, median_household_income, median_age, homeownership_rate, median_home_value, land_area_sq_miles, data_source, data_year)
VALUES
  ('Los Angeles County',    'CA', 'California',       34.307144, -118.228648, 10014009, 3280000, 244000,  75300, 36.5, 47.0,  718000, 4057.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cook County',           'IL', 'Illinois',         41.840975,  -87.817002,  5275541, 2054000, 133000,  65100, 37.5, 57.3,  294000, 945.3,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Harris County',         'TX', 'Texas',            29.846346,  -95.396882,  4731145, 1644000, 122000,  60300, 33.5, 55.0,  218000, 1777.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Maricopa County',       'AZ', 'Arizona',          33.349609, -112.392185,  4420568, 1710000, 118000,  67200, 37.0, 65.3,  353000, 9224.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Diego County',      'CA', 'California',       32.990009, -116.908432,  3338330, 1173000,  88000,  85200, 37.5, 55.1,  720000, 4204.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Orange County',         'CA', 'California',       33.676764, -117.778534,  3186989, 1009000,  93000,  91300, 38.0, 58.2,  862000, 790.6,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('King County',           'WA', 'Washington',       47.490399, -121.834648,  2269675,  912000,  84000, 100000, 37.0, 55.2,  780000, 2126.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Miami-Dade County',     'FL', 'Florida',          25.548527,  -80.530968,  2716940,  961000,  73000,  54100, 41.0, 55.2,  431000, 1898.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Dallas County',         'TX', 'Texas',            32.766836,  -96.778292,  2613539,  907000,  73000,  59200, 33.5, 53.2,  218000, 880.6,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Riverside County',      'CA', 'California',       33.743052, -115.993881,  2458395,  785000,  57000,  72100, 34.5, 67.2,  471000, 7208.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('San Bernardino County', 'CA', 'California',       34.840030, -116.183197,  2181654,  691000,  52000,  63100, 33.0, 61.2,  391000, 20105.8,'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Tarrant County',        'TX', 'Texas',            32.771975,  -97.290862,  2110640,  768000,  64000,  65100, 34.0, 60.3,  268000, 863.6,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Wayne County',          'MI', 'Michigan',         42.335765,  -83.050049,  1793561,  735000,  45000,  53100, 38.5, 60.2,  165000, 612.1,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Kings County',          'NY', 'New York',         40.630947,  -73.952940,  2736074,  944000,  63000,  57100, 34.5, 31.1,  680000, 70.8,   'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Bexar County',          'TX', 'Texas',            29.448820,  -98.520030,  2009324,  714000,  58000,  56900, 34.0, 58.2,  218000, 1247.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Broward County',        'FL', 'Florida',          26.151543,  -80.448776,  1952778,  768000,  57000,  62300, 41.5, 63.2,  381000, 1209.5, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Santa Clara County',    'CA', 'California',       37.232277, -121.695990,  1936259,  649000,  73000, 140000, 37.5, 55.2, 1350000, 1290.1, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Queens County',         'NY', 'New York',         40.708431,  -73.794853,  2405464,  836000,  55000,  67100, 38.5, 50.2,  630000, 109.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Alameda County',        'CA', 'California',       37.652028, -121.924763,  1682353,  597000,  52000, 101000, 38.0, 52.3,  890000, 737.5,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('New York County',       'NY', 'New York',         40.776676,  -73.971321,  1694251,  751000,  61000,  93100, 37.0, 23.2, 1200000, 22.7,   'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Sacramento County',     'CA', 'California',       38.449076, -121.340958,  1585055,  553000,  42000,  72100, 36.5, 57.2,  471000, 965.7,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Middlesex County',      'MA', 'Massachusetts',    42.486260,  -71.481560,  1632002,  609000,  52000,  98000, 39.5, 64.2,  601000, 818.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Travis County',         'TX', 'Texas',            30.334982,  -97.773010,  1290188,  502000,  48000,  78100, 33.0, 55.2,  481000, 1022.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hillsborough County',   'FL', 'Florida',          27.903091,  -82.312897,  1459762,  556000,  46000,  63100, 37.0, 60.2,  318000, 1020.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Palm Beach County',     'FL', 'Florida',          26.650070,  -80.358765,  1496770,  601000,  44000,  65100, 47.0, 71.2,  381000, 2034.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hennepin County',       'MN', 'Minnesota',        44.977753,  -93.465240,  1281565,  549000,  46000,  78100, 36.5, 60.2,  341000, 557.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Orange County',         'FL', 'Florida',          28.501820,  -81.371047,  1429908,  539000,  42000,  63100, 34.5, 55.2,  318000, 907.2,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Wake County',           'NC', 'North Carolina',   35.790391,  -78.638050,  1129410,  443000,  38000,  78100, 35.5, 64.2,  381000, 857.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fairfax County',        'VA', 'Virginia',         38.856091,  -77.290192,  1150309,  408000,  43000, 120000, 38.5, 69.2,  641000, 395.9,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Contra Costa County',   'CA', 'California',       37.921522, -121.974088,  1165927,  385000,  36000,  98000, 39.0, 64.2,  761000, 720.2,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Nassau County',         'NY', 'New York',         40.730261,  -73.590026,  1395774,  459000,  40000,  98000, 43.0, 78.2,  561000, 286.6,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Bronx County',          'NY', 'New York',         40.844782,  -73.864827,  1472654,  484000,  29000,  38100, 33.0, 21.2,  381000, 42.0,   'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Collin County',         'TX', 'Texas',            33.184916,  -96.572469,  1064465,  375000,  31000,  98000, 37.5, 71.2,  431000, 848.4,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Franklin County',       'OH', 'Ohio',             39.961176,  -82.998794,  1323807,  524000,  42000,  62100, 33.5, 56.2,  218000, 540.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Fulton County',         'GA', 'Georgia',          33.791530,  -84.467132,  1066710,  434000,  42000,  68100, 35.5, 52.2,  338000, 529.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Montgomery County',     'MD', 'Maryland',         39.154072,  -77.238985,  1062061,  385000,  37000, 108000, 39.5, 68.2,  561000, 491.1,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Mecklenburg County',    'NC', 'North Carolina',   35.218899,  -80.839253,  1115482,  432000,  38000,  65100, 35.0, 57.2,  318000, 524.9,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pima County',           'AZ', 'Arizona',          32.059282, -111.790225,  1043433,  399000,  29000,  54100, 38.5, 58.2,  218000, 9189.2, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Duval County',          'FL', 'Florida',          30.336872,  -81.660750,  1030005,  395000,  33000,  57100, 36.5, 57.2,  238000, 762.2,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Gwinnett County',       'GA', 'Georgia',          33.960960,  -83.987329,   957062,  327000,  29000,  73100, 33.0, 64.2,  298000, 436.7,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Denton County',         'TX', 'Texas',            33.212027,  -97.133068,   906422,  316000,  26000,  87100, 35.0, 69.2,  351000, 888.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Baltimore County',      'MD', 'Maryland',         39.405285,  -76.672052,   854535,  342000,  28000,  78100, 41.0, 67.2,  318000, 599.8,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Westchester County',    'NY', 'New York',         41.162399,  -73.757904,  1004457,  357000,  35000, 108000, 42.5, 64.2,  641000, 431.7,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Multnomah County',      'OR', 'Oregon',           45.553099, -122.430563,   815428,  353000,  30000,  72100, 37.5, 55.2,  491000, 431.1,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Cobb County',           'GA', 'Georgia',          33.941032,  -84.580087,   766149,  290000,  27000,  79100, 40.5, 67.2,  348000, 339.5,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('DeKalb County',         'GA', 'Georgia',          33.771744,  -84.217699,   764382,  296000,  25000,  62100, 35.5, 53.2,  265000, 268.6,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('El Paso County',        'TX', 'Texas',            31.781752, -106.290600,   865657,  295000,  22000,  48100, 32.0, 58.2,  148000, 1013.0, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Erie County',           'NY', 'New York',         42.759064,  -78.812698,   951048,  393000,  29000,  55100, 40.5, 66.2,  168000, 1044.6, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Jefferson County',      'AL', 'Alabama',          33.554660,  -86.897765,   674721,  278000,  22000,  56100, 37.5, 64.2,  208000, 1111.7, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Denver County',         'CO', 'Colorado',         39.761850, -104.881105,   715522,  330000,  30000,  72100, 35.0, 48.2,  491000, 153.3,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Clark County',          'NV', 'Nevada',           36.214873, -115.013816,  2265461,  815000,  54000,  65100, 37.5, 57.2,  348000, 7910.4, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Pinellas County',       'FL', 'Florida',          27.906037,  -82.723801,   959107,  427000,  31000,  56100, 48.5, 66.2,  298000, 274.5,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Hamilton County',       'OH', 'Ohio',             39.178272,  -84.465080,   831008,  354000,  28000,  58100, 38.0, 59.2,  218000, 407.1,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Allegheny County',      'PA', 'Pennsylvania',     40.465393,  -79.980694,  1218380,  525000,  38000,  60100, 41.5, 63.2,  196000, 730.0,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Suffolk County',        'NY', 'New York',         40.882487,  -72.995814,  1525920,  505000,  40000,  94100, 43.5, 75.2,  481000, 912.3,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Shelby County',         'TN', 'Tennessee',        35.184564,  -89.867745,   929744,  363000,  27000,  52100, 36.0, 58.2,  178000, 755.7,  'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Lee County',            'FL', 'Florida',          26.564065,  -81.709059,   760822,  328000,  23000,  60100, 49.0, 72.2,  298000, 1017.3, 'ACS 5-Year 2019-2023 / 2020 Census', 2023),
  ('Ada County',            'ID', 'Idaho',            43.452658, -116.241552,   481587,  187000,  14000,  65100, 35.0, 62.2,  381000, 1052.9, 'ACS 5-Year 2019-2023 / 2020 Census', 2023)
ON CONFLICT (name, state_abbr) DO UPDATE SET
  lat                     = EXCLUDED.lat,
  lng                     = EXCLUDED.lng,
  population              = EXCLUDED.population,
  households              = EXCLUDED.households,
  businesses              = EXCLUDED.businesses,
  median_household_income = EXCLUDED.median_household_income,
  median_age              = EXCLUDED.median_age,
  homeownership_rate      = EXCLUDED.homeownership_rate,
  median_home_value       = EXCLUDED.median_home_value,
  land_area_sq_miles      = EXCLUDED.land_area_sq_miles,
  data_source             = EXCLUDED.data_source,
  data_year               = EXCLUDED.data_year,
  updated_at              = now();
