export interface ParsedLabel {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

// Hebrew singular/plural pairs aren't simple prefixes here: the last letter of the
// singular is a final-form letter (ן) that becomes a regular letter (נ) once the
// plural suffix follows, so "חלבון" is not a substring of "חלבונים" — list both.
const KEYWORDS: Record<keyof ParsedLabel, RegExp> = {
  calories: /(קלוריות|אנרגיה|energy|calories|kcal)/i,
  protein: /(חלבונים|חלבון|protein)/i,
  carbs: /(פחמימ(ה|ות)|carbohydrates?|carbs)/i,
  fat: /(שומנים|שומן|fat)/i,
}

const NUMBER = /(\d+(?:[.,]\d+)?)/

/** Best-effort extraction of nutrition values from raw OCR text off a label. Always meant to be reviewed by the user, never trusted blindly. */
export function parseNutritionLabel(text: string): ParsedLabel {
  const result: ParsedLabel = {}
  for (const key of Object.keys(KEYWORDS) as (keyof ParsedLabel)[]) {
    const keywordMatch = KEYWORDS[key].exec(text)
    if (!keywordMatch) continue
    const after = text.slice(keywordMatch.index, keywordMatch.index + 40)
    const numberMatch = NUMBER.exec(after.slice(keywordMatch[0].length))
    if (numberMatch) {
      result[key] = Number(numberMatch[1].replace(',', '.'))
    }
  }
  return result
}
