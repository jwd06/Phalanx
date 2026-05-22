function getNutrient(nutrients, name) {
    const match = nutrients.find(n => n.nutrientName === name)
    return match ? Math.round(match.value) : 0
}

export default async function handler(req, res) {
    const foodName = req.query.food
    if (!foodName) return res.status(400).json({ error: "Missing food parameter" })

    try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(foodName)}&pageSize=3&dataType=Foundation,SR%20Legacy`
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
        const detailData = await detailRes.json() 

        const portionMap = {}
        for (const food of detailData){
            if (food.foodPortions && food.foodPortions.length > 0){
                const p = food.foodPortions[0] //returns array of objects, pick first
                portionMap[food.fdcId] = `${p.portionDescription || p.modifier || 'serving'} (${p.gramWeight}g)`
            }
        }

        const results = data.foods.map(food => ({
            nameFood: food.description,
            calories: getNutrient(food.foodNutrients, 'Energy'),
            protein: getNutrient(food.foodNutrients, 'Protein'),
            carbs: getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
            fat: getNutrient(food.foodNutrients, 'Total lipid (fat)'),
            serving: portionMap[food.fdcId] || '100g'
        }))

        res.json(results)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}
