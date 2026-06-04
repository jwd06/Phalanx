import { checkRateLimit, getIp } from './_ratelimit.js'

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end()

    const { success } = await checkRateLimit(`phalanx:barcode:${getIp(req)}`, 30, 900)
    if (!success) return res.status(429).json({ error: 'Too many barcode requests. Please slow down.' })

    const upc = req.query.upc
    if (!upc || !/^\d{8,14}$/.test(upc)) {
        return res.status(400).json({ error: 'Missing or Invalid UPC' })
    }

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(upc)}.json`,
            { headers: { 'User-Agent': 'Phalanx-App/1.0' } }
        )

        if (!response.ok) return res.status(503).json({ error: 'Upstream service unavailable' })

        const data = await response.json()
        if (data.status !== 1 || !data.product) return res.status(404).json({ message: 'Food not found' })

        const product = data.product
        const nutrients = product.nutriments || {}

        res.json([{
            nameFood: product.product_name || product.product_name_en || `Product ${upc}`,
            calories: Math.round(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal'] ?? 0),
            protein: Math.round(nutrients['proteins_100g'] ?? nutrients['proteins'] ?? 0),
            carbs: Math.round(nutrients['carbohydrates_100g'] ?? nutrients['carbohydrates'] ?? 0),
            fat: Math.round(nutrients['fat_100g'] ?? nutrients['fat'] ?? 0),
            portions: [{ description: '100g', gramWeight: 100 }]
        }])
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}
