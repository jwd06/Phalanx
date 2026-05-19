const apiKey = 'PwsC9T45v3vzU1RjFwsMdoMVXLqL13dmh09vcwoL'

async function nutritionFacts() {
    const name = document.getElementById("food-name").value.toLowerCase()

    try {
        const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(name)}&pageSize=3&dataType=Foundation,SR%20Legacy`)
        if (!response.ok) {
            throw new Error("Could not fetch data")
        }
        const data = await response.json()
        const foods = data.foods.map(food => ({
            id: food.fdcId,
            description: food.description,
            brand: food.brandOwner || 'Generic/Raw Food',
            nutrients: food.foodNutrients
        }))

        const macroNames = ['Energy', 'Protein', 'Carbohydrate, by difference', 'Total lipid (fat)', 'Sugars, total including NLEA']
        const microNames = ['Fiber, total dietary', 'Sodium, Na', 'Calcium, Ca', 'Iron, Fe', 'Potassium, K', 'Vitamin C, total ascorbic acid', 'Vitamin A, IU', 'Vitamin D (D2 + D3)', 'Vitamin B-12', 'Vitamin B-6']

        const resultDiv = document.getElementById("result-nutrients")
        resultDiv.innerHTML = foods.map(food => {
            const macros = food.nutrients.filter(n => macroNames.includes(n.nutrientName))
            const micros = food.nutrients.filter(n => microNames.includes(n.nutrientName))

            return `
            <div>
                <strong>${food.description}</strong> - ${food.brand}<br><br>
                <em>Per 100g</em><br><br>
                <p><strong>Macros</strong></p>
                <ul>${macros.map(n => `<li>${n.nutrientName}: ${n.value} ${n.unitName}</li>`).join('')}</ul>
                <p><strong>Micros</strong></p>
                <ul>${micros.map(n => `<li>${n.nutrientName}: ${n.value} ${n.unitName}</li>`).join('')}</ul>
            </div>
            `
        }).join('')
    } catch (error) {
        console.error("Error fetching data from USDA API:", error)
    }
}
