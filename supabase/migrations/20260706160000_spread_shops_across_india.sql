-- Spread shops across major Indian cities
-- This migration assigns unique, realistic coordinates to each shop
-- so they don't all stack on top of each other on the map.

-- Get all shop IDs ordered by created_at and assign different coordinates
-- using a CTE with row numbers to distribute shops across India.

WITH numbered_shops AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn,
         COUNT(*) OVER () AS total_count
  FROM public.shops
),
-- Major Indian city coordinates with realistic offsets for variety
city_coords AS (
  SELECT * FROM (VALUES
    -- Delhi NCR area
    (1,  28.6139, 77.2090, 'Connaught Place, New Delhi'),
    (2,  28.6353, 77.2250, 'Chandni Chowk, Delhi'),
    (3,  28.5672, 77.2100, 'Saket, New Delhi'),
    (4,  28.6280, 77.2195, 'Karol Bagh, Delhi'),
    (5,  28.5741, 77.3270, 'Noida Sector 18'),
    -- Mumbai area
    (6,  19.0760, 72.8777, 'Mumbai Central'),
    (7,  19.0178, 72.8478, 'Bandra West, Mumbai'),
    (8,  19.1136, 72.8697, 'Andheri, Mumbai'),
    (9,  18.9220, 72.8347, 'Colaba, Mumbai'),
    (10, 19.0596, 72.8295, 'Juhu, Mumbai'),
    -- Bangalore area
    (11, 12.9716, 77.5946, 'MG Road, Bangalore'),
    (12, 12.9352, 77.6245, 'Koramangala, Bangalore'),
    (13, 12.9770, 77.5720, 'Malleshwaram, Bangalore'),
    (14, 13.0200, 77.6536, 'Whitefield, Bangalore'),
    (15, 12.9568, 77.7011, 'Marathahalli, Bangalore'),
    -- Hyderabad area
    (16, 17.3850, 78.4867, 'Charminar, Hyderabad'),
    (17, 17.4400, 78.3489, 'HITEC City, Hyderabad'),
    (18, 17.4260, 78.4482, 'Banjara Hills, Hyderabad'),
    (19, 17.4156, 78.4347, 'Jubilee Hills, Hyderabad'),
    (20, 17.4485, 78.3908, 'Madhapur, Hyderabad'),
    -- Chennai area
    (21, 13.0827, 80.2707, 'T Nagar, Chennai'),
    (22, 13.0569, 80.2425, 'Mylapore, Chennai'),
    (23, 13.0674, 80.2376, 'Adyar, Chennai'),
    (24, 13.1067, 80.2206, 'Egmore, Chennai'),
    (25, 12.9941, 80.2554, 'Velachery, Chennai'),
    -- Kolkata area
    (26, 22.5726, 88.3639, 'Park Street, Kolkata'),
    (27, 22.5448, 88.3426, 'New Market, Kolkata'),
    (28, 22.5958, 88.3696, 'Salt Lake, Kolkata'),
    (29, 22.5181, 88.3961, 'Jadavpur, Kolkata'),
    (30, 22.5412, 88.3506, 'Gariahat, Kolkata'),
    -- Pune area
    (31, 18.5204, 73.8567, 'FC Road, Pune'),
    (32, 18.5362, 73.8925, 'Koregaon Park, Pune'),
    (33, 18.5074, 73.8077, 'Kothrud, Pune'),
    (34, 18.5590, 73.7868, 'Hinjewadi, Pune'),
    (35, 18.5314, 73.8446, 'Shivajinagar, Pune'),
    -- Jaipur area
    (36, 26.9124, 75.7873, 'Hawa Mahal, Jaipur'),
    (37, 26.8882, 75.8016, 'Johari Bazaar, Jaipur'),
    (38, 26.9260, 75.8235, 'C-Scheme, Jaipur'),
    (39, 26.8508, 75.8040, 'Malviya Nagar, Jaipur'),
    (40, 26.9047, 75.7586, 'Raja Park, Jaipur'),
    -- Ahmedabad area
    (41, 23.0225, 72.5714, 'Manek Chowk, Ahmedabad'),
    (42, 23.0396, 72.5661, 'CG Road, Ahmedabad'),
    (43, 23.0469, 72.5299, 'SG Highway, Ahmedabad'),
    (44, 23.0130, 72.5263, 'Satellite, Ahmedabad'),
    (45, 22.9946, 72.5997, 'Kankaria, Ahmedabad'),
    -- Lucknow area
    (46, 26.8467, 80.9462, 'Hazratganj, Lucknow'),
    (47, 26.8572, 80.9199, 'Aminabad, Lucknow'),
    (48, 26.8684, 80.9488, 'Gomti Nagar, Lucknow'),
    (49, 26.8380, 80.9346, 'Chowk, Lucknow'),
    (50, 26.8753, 80.9916, 'Indira Nagar, Lucknow'),
    -- Kochi area
    (51, 9.9312, 76.2673, 'Fort Kochi'),
    (52, 9.9816, 76.2999, 'Ernakulam, Kochi'),
    (53, 10.0159, 76.3419, 'Edappally, Kochi'),
    (54, 9.9689, 76.2854, 'MG Road, Kochi'),
    (55, 9.9391, 76.2601, 'Mattancherry, Kochi'),
    -- Chandigarh area
    (56, 30.7333, 76.7794, 'Sector 17, Chandigarh'),
    (57, 30.7413, 76.7679, 'Sector 22, Chandigarh'),
    (58, 30.7046, 76.7179, 'IT Park, Chandigarh'),
    (59, 30.7526, 76.7862, 'Sector 35, Chandigarh'),
    (60, 30.7116, 76.6985, 'Elante Mall area, Chandigarh')
  ) AS t(idx, lat, lng, area_name)
)
UPDATE public.shops s
SET 
  latitude = cc.lat + (RANDOM() * 0.008 - 0.004),  -- Add small random offset (~400m)
  longitude = cc.lng + (RANDOM() * 0.008 - 0.004),
  updated_at = now()
FROM numbered_shops ns
JOIN city_coords cc ON cc.idx = ((ns.rn - 1) % 60) + 1
WHERE s.id = ns.id;
