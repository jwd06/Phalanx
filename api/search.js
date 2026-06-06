import { checkRateLimit, getIp } from './_ratelimit.js'

function getNutrient(nutrients, name) {
    const match = nutrients.find(n => n.nutrientName === name)
    return match ? Math.round(match.value) : 0
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const { success } = await checkRateLimit(`phalanx:search:${getIp(req)}`, 60, 900)
        if (!success) return res.status(429).json({ error: 'Too many search requests. Please slow down.' })
    }
    catch {
        //Redis Unavailable - fail open and allow the request to fall
    }
    
    const foodName = req.query.food
    if (!foodName) return res.status(400).json({ error: "Missing food parameter" })
    if (foodName.length > 200) return res.status(400).json({ error: "Query too long" })

    try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(foodName)}&pageSize=10&dataType=Survey%20(FNDDS)`
        const response = await fetch(url)

        if (!response.ok) throw new Error('USDA API error')

        const data = await response.json()

        if (!data.foods || data.foods.length === 0) {
            return res.status(404).json({ message: "No food found" })
        }

        const fdcIds = data.foods.map(f => f.fdcId)
        const detailRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods?api_key=${process.env.USDA_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fdcIds })
        })
        if (!detailRes.ok) throw new Error('USDA detail API error')
        const detailData = await detailRes.json() 

        const portionMap = {}
        for (const food of detailData){
            if (food.foodPortions && food.foodPortions.length > 0){
                //const p = food.foodPortions[0] //returns array of objects, pick first
                portionMap[food.fdcId] = food.foodPortions.map(p =>({
                    description: `${p.portionDescription || p.modifier || 'serving'}`,
                    gramWeight: p.gramWeight
                }))
            }
        }

        const results = data.foods.map(food => ({
            nameFood: food.description,
            calories: getNutrient(food.foodNutrients, 'Energy'),
            protein: getNutrient(food.foodNutrients, 'Protein'),
            carbs: getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
            fat: getNutrient(food.foodNutrients, 'Total lipid (fat)'),
            portions: portionMap[food.fdcId] || [{description: '100g', gramWeight: 100}]
            //serving: portionMap[food.fdcId] || '100g'
        }))

        res.json(results)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}
