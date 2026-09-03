export interface FoodItem {
  id: string
  name: string
  category: string
  /** Values per 100g */
  calories: number
  protein: number
  carbs: number
  fat: number
  /** For countable items — grams of one typical unit (e.g. one egg) */
  gramsPerUnit?: number
  unitLabel?: string
}

// Approximate standard nutritional reference values per 100g (raw/cooked as noted).
export const FOODS: FoodItem[] = [
  // ביצים ומוצרי חלב
  { id: 'egg', name: 'ביצה', category: 'ביצים וחלב', calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, gramsPerUnit: 55, unitLabel: 'ביצה בינונית' },
  { id: 'egg-white', name: 'חלבון ביצה', category: 'ביצים וחלב', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, gramsPerUnit: 33, unitLabel: 'חלבון ביצה אחת' },
  { id: 'cottage-5', name: 'קוטג׳ 5%', category: 'ביצים וחלב', calories: 98, protein: 11, carbs: 3.4, fat: 5 },
  { id: 'cottage-9', name: 'קוטג׳ 9%', category: 'ביצים וחלב', calories: 125, protein: 11, carbs: 3.5, fat: 9 },
  { id: 'greek-yogurt', name: 'יוגורט יווני 5%', category: 'ביצים וחלב', calories: 97, protein: 9, carbs: 4, fat: 5 },
  { id: 'yogurt-natural', name: 'יוגורט טבעי 3%', category: 'ביצים וחלב', calories: 62, protein: 3.5, carbs: 4.7, fat: 3 },
  { id: 'milk-3', name: 'חלב 3%', category: 'ביצים וחלב', calories: 60, protein: 3.2, carbs: 4.8, fat: 3 },
  { id: 'milk-1', name: 'חלב 1%', category: 'ביצים וחלב', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  { id: 'feta', name: 'גבינה בולגרית 5%', category: 'ביצים וחלב', calories: 155, protein: 13, carbs: 2, fat: 10 },
  { id: 'yellow-cheese', name: 'גבינה צהובה', category: 'ביצים וחלב', calories: 330, protein: 24, carbs: 2, fat: 26 },
  { id: 'labneh', name: 'לבנה', category: 'ביצים וחלב', calories: 130, protein: 5.5, carbs: 4, fat: 10 },
  { id: 'mozzarella-light', name: 'מוצרלה לייט', category: 'ביצים וחלב', calories: 230, protein: 24, carbs: 3, fat: 14 },

  // בשר, עוף ודגים
  { id: 'chicken-breast', name: 'חזה עוף מבושל', category: 'בשר ודגים', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'chicken-thigh', name: 'שוק עוף מבושל', category: 'בשר ודגים', calories: 209, protein: 26, carbs: 0, fat: 11 },
  { id: 'ground-beef-5', name: 'בקר טחון 5%', category: 'בשר ודגים', calories: 137, protein: 21, carbs: 0, fat: 5 },
  { id: 'ground-beef-15', name: 'בקר טחון 15%', category: 'בשר ודגים', calories: 215, protein: 19, carbs: 0, fat: 15 },
  { id: 'beef-steak', name: 'סטייק בקר', category: 'בשר ודגים', calories: 250, protein: 26, carbs: 0, fat: 16 },
  { id: 'turkey-breast', name: 'חזה הודו מבושל', category: 'בשר ודגים', calories: 135, protein: 30, carbs: 0, fat: 1.5 },
  { id: 'salmon', name: 'סלמון', category: 'בשר ודגים', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'tuna-canned', name: 'טונה בשימורים (במים)', category: 'בשר ודגים', calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: 'tilapia', name: 'דניס/אמנון (פילה דג לבן)', category: 'בשר ודגים', calories: 128, protein: 26, carbs: 0, fat: 2.7 },
  { id: 'shrimp', name: 'שרימפס', category: 'בשר ודגים', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },

  // דגנים ופחמימות
  { id: 'white-rice', name: 'אורז לבן מבושל', category: 'דגנים', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'brown-rice', name: 'אורז מלא מבושל', category: 'דגנים', calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
  { id: 'pasta', name: 'פסטה מבושלת', category: 'דגנים', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { id: 'whole-pasta', name: 'פסטה מקמח מלא מבושלת', category: 'דגנים', calories: 124, protein: 5.3, carbs: 25, fat: 1.4 },
  { id: 'quinoa', name: 'קינואה מבושלת', category: 'דגנים', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: 'oats', name: 'שיבולת שועל (יבש)', category: 'דגנים', calories: 379, protein: 13.5, carbs: 67, fat: 6.5 },
  { id: 'couscous', name: 'קוסקוס מבושל', category: 'דגנים', calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  { id: 'bulgur', name: 'בורגול מבושל', category: 'דגנים', calories: 83, protein: 3.1, carbs: 18.5, fat: 0.2 },
  { id: 'potato', name: 'תפוח אדמה אפוי', category: 'דגנים', calories: 93, protein: 2, carbs: 21, fat: 0.1 },
  { id: 'sweet-potato', name: 'בטטה אפויה', category: 'דגנים', calories: 90, protein: 2, carbs: 21, fat: 0.1 },

  // לחם ומאפים
  { id: 'white-bread', name: 'לחם לבן (פרוסה)', category: 'לחם ומאפים', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { id: 'whole-bread', name: 'לחם מלא (פרוסה)', category: 'לחם ומאפים', calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { id: 'pita', name: 'פיתה', category: 'לחם ומאפים', calories: 275, protein: 9, carbs: 55, fat: 1.2, gramsPerUnit: 60, unitLabel: 'פיתה אחת' },
  { id: 'baguette', name: 'באגט', category: 'לחם ומאפים', calories: 270, protein: 9, carbs: 55, fat: 1.5 },
  { id: 'tortilla', name: 'טורטייה', category: 'לחם ומאפים', calories: 218, protein: 6, carbs: 36, fat: 6 },
  { id: 'rice-cake', name: 'פריכיות אורז', category: 'לחם ומאפים', calories: 387, protein: 8, carbs: 82, fat: 3 },
  { id: 'bagel', name: 'בייגל', category: 'לחם ומאפים', calories: 257, protein: 10, carbs: 50, fat: 1.7, gramsPerUnit: 90, unitLabel: 'בייגל אחד' },

  // קטניות
  { id: 'chickpeas', name: 'חומוס מבושל (גרגירים)', category: 'קטניות', calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { id: 'lentils', name: 'עדשים מבושלות', category: 'קטניות', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 'black-beans', name: 'שעועים שחורות מבושלות', category: 'קטניות', calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { id: 'kidney-beans', name: 'שעועים אדומות מבושלות', category: 'קטניות', calories: 127, protein: 8.7, carbs: 23, fat: 0.5 },
  { id: 'edamame', name: 'אדממה', category: 'קטניות', calories: 121, protein: 12, carbs: 9, fat: 5 },
  { id: 'tofu', name: 'טופו', category: 'קטניות', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },

  // ירקות
  { id: 'tomato', name: 'עגבנייה', category: 'ירקות', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 'cucumber', name: 'מלפפון', category: 'ירקות', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 'bell-pepper', name: 'פלפל', category: 'ירקות', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { id: 'carrot', name: 'גזר', category: 'ירקות', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: 'broccoli', name: 'ברוקולי מבושל', category: 'ירקות', calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  { id: 'spinach', name: 'תרד', category: 'ירקות', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'lettuce', name: 'חסה', category: 'ירקות', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { id: 'onion', name: 'בצל', category: 'ירקות', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { id: 'zucchini', name: 'קישוא', category: 'ירקות', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: 'eggplant', name: 'חציל אפוי', category: 'ירקות', calories: 35, protein: 0.8, carbs: 8.7, fat: 0.2 },
  { id: 'mushroom', name: 'פטריות', category: 'ירקות', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { id: 'corn', name: 'תירס', category: 'ירקות', calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },

  // פירות
  { id: 'banana', name: 'בננה', category: 'פירות', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, gramsPerUnit: 120, unitLabel: 'בננה אחת' },
  { id: 'apple', name: 'תפוח עץ', category: 'פירות', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, gramsPerUnit: 150, unitLabel: 'תפוח אחד' },
  { id: 'orange', name: 'תפוז', category: 'פירות', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, gramsPerUnit: 150, unitLabel: 'תפוז אחד' },
  { id: 'watermelon', name: 'אבטיח', category: 'פירות', calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },
  { id: 'grapes', name: 'ענבים', category: 'פירות', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { id: 'strawberry', name: 'תות שדה', category: 'פירות', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'mango', name: 'מנגו', category: 'פירות', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { id: 'avocado', name: 'אבוקדו', category: 'פירות', calories: 160, protein: 2, carbs: 8.5, fat: 15, gramsPerUnit: 200, unitLabel: 'אבוקדו אחד' },
  { id: 'date', name: 'תמר', category: 'פירות', calories: 282, protein: 2.5, carbs: 75, fat: 0.4, gramsPerUnit: 8, unitLabel: 'תמר אחד' },
  { id: 'pineapple', name: 'אננס', category: 'פירות', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },

  // אגוזים ושומנים
  { id: 'almonds', name: 'שקדים', category: 'אגוזים ושומנים', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'walnuts', name: 'אגוזי מלך', category: 'אגוזים ושומנים', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 'peanut-butter', name: 'חמאת בוטנים', category: 'אגוזים ושומנים', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'olive-oil', name: 'שמן זית', category: 'אגוזים ושומנים', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'tahini', name: 'טחינה גולמית', category: 'אגוזים ושומנים', calories: 595, protein: 17, carbs: 21, fat: 54 },
  { id: 'cashews', name: 'קשיו', category: 'אגוזים ושומנים', calories: 553, protein: 18, carbs: 30, fat: 44 },
  { id: 'chia', name: 'זרעי צ׳יה', category: 'אגוזים ושומנים', calories: 486, protein: 17, carbs: 42, fat: 31 },

  // חטיפים ומתוקים
  { id: 'dark-chocolate', name: 'שוקולד מריר 70%', category: 'חטיפים', calories: 598, protein: 7.8, carbs: 46, fat: 43 },
  { id: 'protein-bar', name: 'חטיף חלבון', category: 'חטיפים', calories: 380, protein: 30, carbs: 35, fat: 12 },
  { id: 'granola', name: 'גרנולה', category: 'חטיפים', calories: 471, protein: 10, carbs: 64, fat: 20 },
  { id: 'popcorn', name: 'פופקורן (ללא שמן)', category: 'חטיפים', calories: 387, protein: 13, carbs: 78, fat: 5 },
  { id: 'ice-cream', name: 'גלידה', category: 'חטיפים', calories: 207, protein: 3.5, carbs: 24, fat: 11 },

  // משקאות
  { id: 'protein-shake', name: 'שייק חלבון (אבקה, יבש)', category: 'משקאות', calories: 380, protein: 75, carbs: 8, fat: 5 },
  { id: 'orange-juice', name: 'מיץ תפוזים סחוט', category: 'משקאות', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2 },
]

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 12)
}

export function computeFromGrams(food: FoodItem, grams: number) {
  const ratio = grams / 100
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
  }
}
