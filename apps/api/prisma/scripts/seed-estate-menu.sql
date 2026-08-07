-- The estate's standing menu, as printed.
--
-- Run once after the menu_composition migration. Safe to re-run: every row
-- carries a deterministic id derived from its course and name, so a second run
-- inserts nothing rather than duplicating the card.
--
--   psql "$DATABASE_URL" -f apps/api/prisma/scripts/seed-estate-menu.sql
--
-- DIETARY FLAGS ARE NOT COMPLETE. Only allergens named outright in a dish title
-- are set below — shellfish and nuts, the two that send people to hospital.
-- Everything else is left false, which the apps render as "nothing stated"
-- rather than "nothing present". The kitchen must go through the library in the
-- dashboard and set vegetarian/vegan/gluten/dairy properly before this is put
-- in front of a guest.

BEGIN;

WITH dish (course, category, sort_order, name, shellfish, nuts) AS (
  VALUES
  -- ── Breakfast · main course ───────────────────────────── choose 3 ────────
  ('BREAKFAST_MAIN', 'BREAKFAST',  1, 'Freshly Pressed Juice of the Day', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  2, 'Locally Roasted Coffee & Curated Selection of Fine Teas', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  3, 'Artisanal Greek Yogurt', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  4, 'House-Made Granola', false, true),
  ('BREAKFAST_MAIN', 'BREAKFAST',  5, 'Seasonal Market Fruit', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  6, 'Selection of Freshly Baked Artisan Breads', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  7, 'House-Made Preserves & Local Honey', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  8, 'Buttermilk Pancakes with Pure Maple Syrup', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST',  9, 'Crispy Bacon', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST', 10, 'Traditional Refried Beans', false, false),
  ('BREAKFAST_MAIN', 'BREAKFAST', 11, 'Farm Eggs, Cooked to Your Preference', false, false),

  -- ── Breakfast · daily suggestion ──────────────────────── choose 1 ────────
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  1, 'Red Chilaquiles with Shredded Chicken Tinga', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  2, 'Enmoladas with Mancha Mantel Mole, Filled with Sweet Plantain', false, true),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  3, 'Blue Corn Sopes with Oaxacan Chorizo', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  4, 'Memelas with Fresh Oaxacan Quesillo and Tasajo', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  5, 'Enfrijoladas with Wild Mushrooms and Huitlacoche', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  6, 'Green Chilaquiles with Marinated Cecina', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  7, 'Oaxacan Tamal with Roasted Poblano Peppers, Crema & Chipilín', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  8, 'Tlacoyo with Fava Beans, Nopales & Fresh Cheese', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST',  9, 'Swiss Enchiladas with Hoja Santa Green Sauce', false, false),
  ('BREAKFAST_SUGGESTION', 'BREAKFAST', 10, 'Entomatadas with Locally Raised Buffalo Steak', false, false),

  -- ── Poolside lunch · curated selection ────────────────── choose 5 ────────
  ('LUNCH_SELECTION', 'LUNCH',  1, 'Molcajete Guacamole with Pico de Gallo & Chapulines', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  2, 'Chickpea Hummus with Tahini Cream & Selection of Seasonal Crudités', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  3, 'Lentil Hummus with Hoja Santa Oil & Selection of Seasonal Crudités', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  4, 'Sailfish Ceviche with Leche de Tigre & Mango Cream', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  5, 'Black Aguachile with Shrimp, Jícama & Lime Foam', true, false),
  ('LUNCH_SELECTION', 'LUNCH',  6, 'Octopus Tostada with Fire-Roasted Habanero Aioli', true, false),
  ('LUNCH_SELECTION', 'LUNCH',  7, 'Crispy Beer-Battered Fish Tacos', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  8, 'Beef Quesabirria with Traditional Consommé', false, false),
  ('LUNCH_SELECTION', 'LUNCH',  9, 'Coconut-Crusted Shrimp with House Special Aioli', true, false),
  ('LUNCH_SELECTION', 'LUNCH', 10, 'Zarandeado Shrimp Skewers with Cured Plantain', true, false),
  ('LUNCH_SELECTION', 'LUNCH', 11, 'Creamy Rice Croquettes with Parmigiano Reggiano & Braised Beef', false, false),
  ('LUNCH_SELECTION', 'LUNCH', 12, 'Blue Crab Croquettes with House Special Aioli', true, false),
  ('LUNCH_SELECTION', 'LUNCH', 13, 'Esquites with Truffle Foam', false, false),
  ('LUNCH_SELECTION', 'LUNCH', 14, 'Garden Salad with Chepiche Vinaigrette & Fire-Roasted Almonds', false, true),
  ('LUNCH_SELECTION', 'LUNCH', 15, 'Hand-Cut French Fries & Sweet Potato Fries', false, false),
  ('LUNCH_SELECTION', 'LUNCH', 16, 'House-Made Ice Cream Selection', false, false),
  ('LUNCH_SELECTION', 'LUNCH', 17, 'Chilled Watermelon & Mango with House-Made Chamoy', false, false),

  -- ── Fine dining · starters ────────────────────────────── choose 1 ────────
  ('DINNER_STARTER', 'DINNER',  1, 'Green Aguachile with Cucumber & Coconut Foam', false, false),
  ('DINNER_STARTER', 'DINNER',  2, 'Shrimp Broth with Parmesan Cheese Crisp', true, false),
  ('DINNER_STARTER', 'DINNER',  3, 'Traditional Beef Broth with Seasonal Garnishes', false, false),
  ('DINNER_STARTER', 'DINNER',  4, 'Tuna "Papalote" with Coastal Sauce', false, false),
  ('DINNER_STARTER', 'DINNER',  5, 'Shrimp Tostada', true, false),
  ('DINNER_STARTER', 'DINNER',  6, 'Local Heirloom Tomato Tostada with Chepiche Vinaigrette & Crispy Almonds', false, true),
  ('DINNER_STARTER', 'DINNER',  7, 'Crispy Squid Taco with Pipián & Roasted Bell Pepper Cream', true, true),
  ('DINNER_STARTER', 'DINNER',  8, 'Sailfish Tostada with Passion Fruit Vinaigrette & Beetroot', false, false),
  ('DINNER_STARTER', 'DINNER',  9, 'Roasted Local Eggplant with Herb Yogurt Sauce', false, false),
  ('DINNER_STARTER', 'DINNER', 10, 'Esquites with Truffle Foam', false, false),

  -- ── Fine dining · main dish ───────────────────────────── choose 1 ────────
  ('DINNER_MAIN', 'DINNER',  1, 'Grilled Ribeye with Potato & Sweet Potato Gratin', false, false),
  ('DINNER_MAIN', 'DINNER',  2, 'Zarandeado Sierra Fish with Coconut Rice & Plantain', false, false),
  ('DINNER_MAIN', 'DINNER',  3, 'Shrimp & Fava Bean Risotto with Hoja Santa Oil & Parmigiano Reggiano', true, false),
  ('DINNER_MAIN', 'DINNER',  4, 'Confit Suckling Pig with Red Mango & Ginger Pipián, Fresh Sweet Corn Polenta', false, true),
  ('DINNER_MAIN', 'DINNER',  5, 'Braised Beef with Mezcal-Flambéed Apricots, Sweet Potato Purée, Corn & Wild Mushrooms', false, false),
  ('DINNER_MAIN', 'DINNER',  6, 'Spice-Lacquered Duck with Wild Rice, Candied Squash & Black Mole', false, true),
  ('DINNER_MAIN', 'DINNER',  7, 'Sesame-Crusted Tuna Tataki with Smoked Cauliflower Cream', false, false),
  ('DINNER_MAIN', 'DINNER',  8, 'Avocado Leaf-Roasted Lamb Belly with Fire-Roasted Tomato Sauce & Chilled Green Bean Salad', false, false),
  ('DINNER_MAIN', 'DINNER',  9, 'Sailfish Baked en Papillote in Banana Leaf with Potato Purée & Charred Eggplant', false, false),
  ('DINNER_MAIN', 'DINNER', 10, 'Spaghetti with Truffle Cream & Wild Mushrooms', false, false),

  -- ── Fine dining · dessert ─────────────────────────────── choose 1 ────────
  ('DINNER_DESSERT', 'DINNER',  1, 'Red Berry & Hibiscus Pavlova', false, false),
  ('DINNER_DESSERT', 'DINNER',  2, 'Strawberry & Vanilla Tart with Hoja Santa Ice Cream', false, false),
  ('DINNER_DESSERT', 'DINNER',  3, 'Cacao Churros with Chocolate Ganache & Mamey Ice Cream', false, false),
  ('DINNER_DESSERT', 'DINNER',  4, 'Rum-Flambéed Bananas with Passion Fruit & Coconut Ice Cream', false, false),
  ('DINNER_DESSERT', 'DINNER',  5, 'Tiramisù with Pluma Hidalgo Coffee & Mezcal', false, false),
  ('DINNER_DESSERT', 'DINNER',  6, 'Traditional Neapolitan Flan with Hazelnut Caramel', false, true),
  ('DINNER_DESSERT', 'DINNER',  7, 'White Chocolate Heart & Spiced Chocolate Lava Cake', false, false),
  ('DINNER_DESSERT', 'DINNER',  8, 'Pineapple & Coconut Crumble', false, false),
  ('DINNER_DESSERT', 'DINNER',  9, 'Lemon & Basil Tart with Italian Meringue', false, false),
  ('DINNER_DESSERT', 'DINNER', 10, 'Sweet Corn Cake with Tres Leches Ice Cream', false, false)
)
INSERT INTO "MenuItem" (
  "id", "name", "category", "course", "isActive", "isStanding",
  "isVegetarian", "isVegan", "isGlutenFree",
  "containsNuts", "containsDairy", "containsShellfish",
  "sortOrder", "createdAt", "updatedAt", "createdBy"
)
SELECT
  'menu_' || substr(md5(dish.course || '|' || dish.name), 1, 20),
  dish.name,
  dish.category::"MenuCategory",
  dish.course::"MenuCourse",
  true,
  true,
  false, false, false,
  dish.nuts, false, dish.shellfish,
  dish.sort_order,
  now(),
  now(),
  'estate_menu_seed'
FROM dish
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- What went in, by course.
SELECT "course", count(*) AS dishes
FROM "MenuItem"
WHERE "createdBy" = 'estate_menu_seed'
GROUP BY "course"
ORDER BY "course";
