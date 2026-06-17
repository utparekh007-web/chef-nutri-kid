export interface Recipe {
  mealName: string;
  plateBreakdown: {
    fruitsVeggies: string;
    wholeGrains: string;
    strongProtein: string;
    fatsHydrates: string;
  };
  nutritionalFocus?: string;
  allergyCheck?: string;
  medicalDisclaimer?: string;
  instructions: string[];
  juniorDuties: string[];
  powerMealFact: string;
  moveChallenge: string;
  tutorialQuery: string;
  dietIndicator: string;
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    keyVitamins: string;
  };
}

export type DietaryPreference = 'Any / No Restriction' | 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian' | 'Jain';

export interface ChildProfile {
  id: string;
  name: string;
  dob: string;        // Date of birth: YYYY-MM-DD — used for auto age calculation
  age: number;        // in years (auto-calculated from dob)
  ageMonths: number;  // extra months (auto-calculated)
  ageDays: number;    // extra days (auto-calculated)
  ageDisplay: string; // e.g. "1 year 2 months 6 days"
  weight: number;     // in kg
  foodCategories: DietaryPreference;
  allergies: string[];
  createdAt: string;  // ISO date — when profile was first created (locked after)
  isLocked: boolean;  // true = cannot edit child name/dob after creation
}

export type AgeGroup = '1-3 years (Toddler)' | '4-5 years (Preschooler)' | '6-12 years (School Age)';

export interface DailyMeal {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  powerFact: string;
}

export interface WeeklyChart {
  title: string;
  tips: string[];
  days: DailyMeal[];
  shoppingList: string[];
}

export interface HealthReport {
  childName: string;
  medicalDisclaimer: string;
  healthSummary: string;
  growthChartAnalysis: string;
  proactivePlateStrategy: string[];
  allergySafetyShield: string;
  milestoneTracker: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: 'fruitsVeggies' | 'wholeGrains' | 'strongProtein' | 'fatsHydrates';
  color: string;
}

export const PRESET_INGREDIENTS: FoodItem[] = [
  // Fruits & Veggies
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'fruitsVeggies', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { id: 'carrots', name: 'Carrots', emoji: '🥕', category: 'fruitsVeggies', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'fruitsVeggies', color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 'apples', name: 'Apples', emoji: '🍎', category: 'fruitsVeggies', color: 'bg-red-100 border-red-300 text-red-800' },
  { id: 'tomatoes', name: 'Tomatoes', emoji: '🍅', category: 'fruitsVeggies', color: 'bg-red-100 border-red-300 text-red-800' },
  { id: 'sweet_potato', name: 'Sweet Potato', emoji: '🍠', category: 'fruitsVeggies', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { id: 'pepper', name: 'Bell Pepper', emoji: '🫑', category: 'fruitsVeggies', color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 'berries', name: 'Berries', emoji: '🍓', category: 'fruitsVeggies', color: 'bg-rose-100 border-rose-300 text-rose-800' },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'fatsHydrates', color: 'bg-lime-100 border-lime-300 text-lime-800' },

  // Whole Grains
  { id: 'brown_rice', name: 'Brown Rice', emoji: '🍚', category: 'wholeGrains', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'whole_wheat_bread', name: 'Whole Wheat Bread', emoji: '🍞', category: 'wholeGrains', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'oats', name: 'Oats', emoji: '🥣', category: 'wholeGrains', color: 'bg-amber-100 border-amber-200 text-amber-800' },
  { id: 'quinoa', name: 'Quinoa', emoji: '🌾', category: 'wholeGrains', color: 'bg-amber-50 border-amber-300 text-amber-800' },
  { id: 'whole_pasta', name: 'Wheat Pasta', emoji: '🍝', category: 'wholeGrains', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },

  // Healthy Protein
  { id: 'chicken', name: 'Chicken Breast', emoji: '🍗', category: 'strongProtein', color: 'bg-rose-50 border-rose-200 text-rose-800' },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', category: 'strongProtein', color: 'bg-stone-100 border-stone-300 text-stone-800' },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', category: 'strongProtein', color: 'bg-sky-50 border-sky-200 text-sky-800' },
  { id: 'chickpeas', name: 'Chickpeas', emoji: '🫘', category: 'strongProtein', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'tofu', name: 'Tofu', emoji: '🟧', category: 'strongProtein', color: 'bg-neutral-100 border-neutral-300 text-neutral-800' },
  { id: 'yogurt', name: 'Greek Yogurt', emoji: '🥛', category: 'strongProtein', color: 'bg-blue-50 border-blue-200 text-blue-800' },

  // Fats & Hydration
  { id: 'olive_oil', name: 'Olive Oil', emoji: '🫗', category: 'fatsHydrates', color: 'bg-lime-50 border-lime-200 text-lime-800' },
  { id: 'walnuts', name: 'Walnuts', emoji: '🥜', category: 'fatsHydrates', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { id: 'seeds', name: 'Chia Seeds', emoji: '🌱', category: 'fatsHydrates', color: 'bg-green-50 border-green-200 text-green-800' },
  { id: 'water', name: 'Fresh Water', emoji: '💧', category: 'fatsHydrates', color: 'bg-sky-100 border-sky-300 text-sky-800' }
];

export const COMMON_INGREDIENTS_DB = [
  // Fruits
  "Apple", "Avocado", "Banana", "Blueberries", "Cherry", "Coconut", "Custard Apple",
  "Dates", "Dragon Fruit", "Figs", "Grapes", "Grapefruit", "Guava", "Honeydew",
  "Jackfruit", "Jamun", "Kiwi", "Lemon", "Lime", "Lychee", "Mango", "Melon",
  "Mulberry", "Orange", "Papaya", "Peach", "Pear", "Pineapple", "Plum",
  "Pomegranate", "Raspberry", "Sapota", "Starfruit", "Strawberries", "Tangerine",
  "Watermelon", "Cantaloupe", "Amla", "Karonda", "Bael", "Tamarind",

  // Vegetables
  "Artichoke", "Asparagus", "Baby Corn", "Bell Pepper", "Bitter Gourd", "Bok Choy",
  "Bottle Gourd", "Broccoli", "Brussels Sprouts", "Cabbage", "Capsicum", "Carrots",
  "Cauliflower", "Celery", "Chili Pepper", "Cluster Beans", "Corn", "Cucumber",
  "Drumstick", "Eggplant", "Flat Beans", "Garlic", "Ginger", "Green Beans",
  "Ivy Gourd", "Kale", "Leek", "Lettuce", "Mushrooms", "Okra", "Onion",
  "Pointed Gourd", "Potatoes", "Pumpkin", "Radish", "Raw Banana", "Raw Papaya",
  "Ridge Gourd", "Scallion", "Shallot", "Snake Gourd", "Spinach", "Spring Onion",
  "Squash", "Sweet Potato", "Taro Root", "Tomatoes", "Turnip", "Yam", "Zucchini",
  "Beetroot", "Lotus Root", "Colocasia", "Arrowroot", "Moringa Leaves",
  "Fenugreek Leaves", "Mustard Leaves", "Curry Leaves", "Mint Leaves",
  "Coriander Leaves", "Amaranth Leaves", "Bathua", "Sarson", "Suran",

  // Lentils & Pulses (Dal)
  "Black Eyed Peas", "Black Lentils", "Chickpeas", "Chana Dal", "Green Moong Dal",
  "Horse Gram", "Kidney Beans", "Lentils", "Masoor Dal", "Moong Dal", "Peas",
  "Pigeon Peas", "Pinto Beans", "Rajma", "Soya Beans", "Toor Dal", "Urad Dal",
  "White Peas", "Yellow Moong Dal", "Moth Beans", "Val Dal", "Chawli",

  // Grains & Rice
  "Basmati Rice", "Brown Rice", "Broken Wheat", "Corn Flour", "Dalia", "Jowar",
  "Maize", "Millet", "Oats", "Poha", "Quinoa", "Ragi", "Rice", "Sabudana",
  "Semolina", "Suji", "Wheat", "White Rice", "Wheat Pasta", "Whole Wheat Bread",
  "Bajra", "Barley", "Amaranth", "Buckwheat", "Corn Starch", "Idli Rice",

  // Flour
  "All Purpose Flour", "Almond Flour", "Besan", "Coconut Flour", "Maida",
  "Rajgira Flour", "Rice Flour", "Ragi Flour", "Wheat Flour", "Jowar Flour",
  "Bajra Flour", "Nachni Flour", "Kuttu Flour",

  // Dairy & Protein
  "Butter", "Buttermilk", "Cheddar Cheese", "Cheese", "Chicken Breast",
  "Chicken Curry Cut", "Chicken Legs", "Chicken Thighs", "Condensed Milk",
  "Cottage Cheese", "Cream", "Cream Cheese", "Eggs", "Fish", "Greek Yogurt",
  "Hung Curd", "Khoya", "Milk", "Mozzarella", "Mutton", "Paneer", "Pork",
  "Prawns", "Rohu Fish", "Salmon", "Sardines", "Shrimp", "Tofu", "Tuna",
  "Turkey", "Whey Protein", "Yogurt", "Curd", "Dahi", "Malai",

  // Nuts & Seeds
  "Almonds", "Cashews", "Chia Seeds", "Flax Seeds", "Hemp Seeds", "Macadamia",
  "Melon Seeds", "Peanut Butter", "Peanuts", "Pecans", "Pine Nuts", "Pistachios",
  "Pumpkin Seeds", "Sesame Seeds", "Sunflower Seeds", "Walnuts", "Charoli",
  "Fox Nuts", "Makhana", "Watermelon Seeds",

  // Oils & Fats
  "Coconut Oil", "Ghee", "Groundnut Oil", "Mustard Oil", "Olive Oil",
  "Rice Bran Oil", "Sesame Oil", "Sunflower Oil", "Til Oil",

  // Spices & Masala
  "Ajwain", "Asafoetida", "Bay Leaf", "Black Pepper", "Black Salt", "Cardamom",
  "Chaat Masala", "Cinnamon", "Cloves", "Coriander Powder", "Cumin",
  "Cumin Powder", "Curry Powder", "Dried Mango Powder", "Fenugreek Seeds",
  "Garam Masala", "Green Cardamom", "Hing", "Jeera", "Kashmiri Red Chili",
  "Kesar", "Mace", "Mustard Seeds", "Nutmeg", "Oregano", "Paprika",
  "Pepper Powder", "Red Chili Powder", "Saffron", "Salt", "Star Anise",
  "Turmeric", "White Pepper", "Thyme", "Basil", "Rosemary", "Amchur",
  "Sambar Powder", "Rasam Powder", "Biryani Masala", "Pav Bhaji Masala",

  // Sauces & Condiments
  "Coconut Milk", "Green Chutney", "Honey", "Imli", "Ketchup", "Mayonnaise",
  "Mustard", "Soy Sauce", "Tamarind Paste", "Tomato Puree", "Vinegar",
  "Worcestershire Sauce", "Peanut Chutney", "Mint Chutney",

  // Sweeteners
  "Brown Sugar", "Coconut Sugar", "Jaggery", "Mishri", "Stevia", "Sugar",
  "Maple Syrup", "Gud",

  // Beverages & Others
  "Cocoa Powder", "Coffee", "Fresh Water", "Green Tea", "Rose Water",
  "Vanilla Extract", "Baking Powder", "Baking Soda", "Cornflour",
  "Dark Chocolate", "Dry Fruits Mix", "Gelatin", "Yeast"
];
