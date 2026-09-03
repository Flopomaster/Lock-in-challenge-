// Looks up a scanned barcode against Open Food Facts — a free, keyless,
// community-maintained product database (openfoodfacts.org).
export interface ScannedProduct {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,nutriments`,
  )
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const n = data.product.nutriments ?? {}
  const kcal =
    n['energy-kcal_100g'] ?? (n['energy_100g'] !== undefined ? n['energy_100g'] / 4.184 : undefined)
  if (kcal === undefined) return null

  return {
    name: data.product.product_name || 'מוצר סרוק',
    calories: Math.round(kcal),
    protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
  }
}
