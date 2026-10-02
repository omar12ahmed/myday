// Ingredient words, used for your "leave out" preferences and for shopping-list aisles.
// Ported from the current MyDay. These only read ingredient names and a recipe's category, so they can't
// guarantee a recipe is free from an allergen (the screens say so).
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole words, singular or plural: wordsRe(['egg']) matches "egg" and "eggs", not "eggplant".
export const wordsRe = (words: string[]) => new RegExp('\\b(?:' + words.map(escRe).join('|') + ')(?:s|es)?\\b', 'i');

export const MEAT = ['pork', 'bacon', 'ham', 'sausage', 'chorizo', 'prosciutto', 'pancetta', 'salami', 'gammon', 'lard', 'pepperoni', 'beef', 'steak', 'brisket', 'oxtail', 'veal', 'lamb', 'mutton', 'goat', 'chicken', 'turkey', 'duck', 'goose', 'venison', 'mince', 'meatball', 'gelatin', 'gelatine'];
export const FISH = ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'pollock', 'prawn', 'shrimp', 'crab', 'lobster', 'anchovy', 'anchovies', 'sardine', 'mackerel', 'mussel', 'clam', 'oyster', 'squid', 'scallop', 'octopus', 'trout', 'tilapia', 'sea bass', 'monkfish', 'kipper', 'fish sauce'];
export const DAIRY = ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'parmesan', 'mozzarella', 'cheddar', 'ghee', 'creme fraiche', 'crème fraîche', 'ricotta', 'feta', 'mascarpone', 'paneer', 'buttermilk', 'custard', 'halloumi', 'brie', 'gruyere', 'gouda', 'whey', 'quark'];
// Plant "milks" and nut butters aren't dairy.
export const NOT_DAIRY = /\b(coconut|almond|oat|soy|soya|rice|peanut|cocoa|nut|cashew)\s+(milk|butter|cream|yogh?urt)\b/i;

export interface Exclusion { label: string; words: string[]; cats: string[]; dairy?: boolean; re: RegExp }
const ex = (label: string, words: string[], cats: string[], dairy = false): Exclusion => ({ label, words, cats, dairy, re: wordsRe(words) });
export const EXCLUSIONS: Record<string, Exclusion> = {
  vegetarian: ex('Vegetarian (no meat or fish)', MEAT.concat(FISH), ['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Goat']),
  vegan: ex('Vegan (no animal products)', MEAT.concat(FISH, DAIRY, ['egg', 'eggs', 'honey', 'mayonnaise']), ['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Goat'], true),
  pork: ex('No pork', ['pork', 'bacon', 'ham', 'sausage', 'chorizo', 'prosciutto', 'pancetta', 'salami', 'gammon', 'lard', 'pepperoni'], ['Pork']),
  beef: ex('No beef', ['beef', 'steak', 'brisket', 'oxtail', 'veal'], ['Beef']),
  lamb: ex('No lamb or goat', ['lamb', 'mutton', 'goat'], ['Lamb', 'Goat']),
  poultry: ex('No poultry', ['chicken', 'turkey', 'duck', 'goose'], ['Chicken']),
  seafood: ex('No fish or seafood', FISH, ['Seafood']),
  dairy: ex('No dairy', DAIRY, [], true),
  eggs: ex('No eggs', ['egg', 'eggs', 'egg yolk', 'egg white', 'mayonnaise', 'meringue'], []),
  nuts: ex('No nuts', ['nut', 'nuts', 'almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'peanut', 'macadamia', 'brazil nut', 'pine nut', 'marzipan', 'praline', 'nutella'], []),
  gluten: ex('No gluten (wheat, barley, rye…)', ['flour', 'bread', 'breadcrumb', 'pasta', 'spaghetti', 'penne', 'macaroni', 'lasagne', 'lasagna', 'noodle', 'wheat', 'barley', 'rye', 'couscous', 'bulgur', 'semolina', 'soy sauce', 'pastry', 'tortilla', 'pitta', 'naan', 'biscuit', 'cracker', 'beer', 'seitan', 'udon', 'cake', 'digestive'], ['Pasta']),
};

// Shopping-list aisles, and which words put an ingredient in each (the first match wins).
export const SHOP_CATEGORIES = ['Fruit & veg', 'Meat & fish', 'Dairy & eggs', 'Bakery', 'Cupboard', 'Herbs & spices', 'Frozen', 'Other'];
const CATEGORY_RULES: [string, RegExp][] = ([
  ['Frozen', ['frozen']],
  ['Cupboard', ['coconut milk', 'coconut cream', 'peanut butter', 'soy sauce', 'fish sauce', 'tomato paste', 'tomato puree', 'tomato purée', 'stock', 'stock cube', 'bouillon', 'cornflour', 'corn flour', 'breadcrumb', 'egg noodle', 'chopped tomatoes', 'tinned tomatoes', 'canned tomatoes']],
  ['Herbs & spices', ['salt', 'black pepper', 'white pepper', 'pepper flakes', 'peppercorn', 'cumin', 'paprika', 'cinnamon', 'oregano', 'thyme', 'rosemary', 'turmeric', 'garam masala', 'curry powder', 'chilli powder', 'chili powder', 'nutmeg', 'clove', 'bay leaf', 'bay leaves', 'cardamom', 'coriander seed', 'ground ginger', 'ground coriander', 'mixed spice', 'allspice', 'cayenne', 'five spice', 'saffron', 'vanilla', 'sage', 'dried']],
  ['Meat & fish', MEAT.concat(FISH)],
  ['Dairy & eggs', DAIRY.concat(['egg', 'eggs'])],
  ['Bakery', ['bread', 'tortilla', 'wrap', 'bun', 'pitta', 'naan', 'bagel', 'roll', 'croissant', 'baguette', 'brioche']],
  ['Fruit & veg', ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'pepper', 'lettuce', 'spinach', 'lemon', 'lime', 'apple', 'banana', 'ginger', 'parsley', 'coriander', 'basil', 'mint', 'mushroom', 'broccoli', 'courgette', 'zucchini', 'aubergine', 'eggplant', 'cucumber', 'celery', 'leek', 'chilli', 'chili', 'avocado', 'cabbage', 'kale', 'pea', 'spring onion', 'shallot', 'sweet potato', 'squash', 'pumpkin', 'orange', 'berry', 'berries', 'strawberry', 'blueberry', 'beansprout', 'cauliflower', 'asparagus', 'beetroot', 'radish', 'fennel', 'rocket', 'vegetable', 'fruit', 'pear', 'mango', 'pineapple', 'grape', 'cherry', 'dill', 'chive', 'scallion', 'herbs']],
  ['Cupboard', ['rice', 'pasta', 'spaghetti', 'noodle', 'flour', 'sugar', 'oil', 'vinegar', 'honey', 'oat', 'lentil', 'chickpea', 'bean', 'tin', 'tinned', 'canned', 'sauce', 'paste', 'ketchup', 'mustard', 'mayonnaise', 'jam', 'syrup', 'cornstarch', 'baking powder', 'baking soda', 'bicarbonate', 'yeast', 'cocoa', 'chocolate', 'couscous', 'quinoa', 'nut', 'almond', 'raisin', 'wine', 'gelatin', 'polenta']],
] as [string, string[]][]).map(([cat, words]) => [cat, wordsRe(words)]);
export function categoryFor(name: string): string { for (const [cat, re] of CATEGORY_RULES) if (re.test(name)) return cat; return 'Other'; }
