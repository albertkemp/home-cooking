-- Fix database issues

-- 1. Create menus for cooks who don't have one
INSERT INTO "Menu" ("id", "name", "description", "cookId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), 
  'My Menu', 
  'My food offerings', 
  u.id, 
  NOW(), 
  NOW()
FROM "User" u
WHERE u.role = 'COOK'
AND NOT EXISTS (
  SELECT 1 FROM "Menu" m WHERE m."cookId" = u.id
);

-- 2. Update food items without menu to use the cook's menu
UPDATE "FoodItem" fi
SET "menuId" = (
  SELECT m.id FROM "Menu" m 
  WHERE m."cookId" = fi."cookId" 
  LIMIT 1
)
WHERE fi."menuId" IS NULL;

-- 3. Delete orphaned images (images without food items)
DELETE FROM "Image"
WHERE "foodItemId" IS NULL;

-- 4. Ensure all food items have a valid menu
UPDATE "FoodItem" fi
SET "menuId" = (
  SELECT m.id FROM "Menu" m 
  WHERE m."cookId" = fi."cookId" 
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1 FROM "Menu" m WHERE m.id = fi."menuId"
); 