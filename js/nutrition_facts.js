async function nutritionFacts() {
    const name = document.getElementById('food-name').value.trim()
    const resultDiv = document.getElementById('result-nutrients')

    if (!name) {
        resultDiv.innerHTML = '<p style="color:red">Please enter a food name.</p>'
        return
    }

    resultDiv.innerHTML = '<p>Searching...</p>'

    try {
        const response = await fetch(`/api/search?food=${encodeURIComponent(name)}`)

        if (response.status === 404) {
            resultDiv.innerHTML = '<p>No results found. Try a different food name.</p>'
            return
        }

        if (!response.ok) throw new Error('Server error')

        const foods = await response.json()

        resultDiv.innerHTML = foods.map(food => `
            <div>
                <strong>${food.nameFood}</strong><br><br>
                <em>Per 100g</em><br>
                <ul>
                    <li>Calories: ${food.calories} kcal</li>
                    <li>Protein: ${food.protein}g</li>
                    <li>Carbs: ${food.carbs}g</li>
                    <li>Fat: ${food.fat}g</li>
                </ul>
            </div>
        `).join('<hr>')
    } catch (error) {
        console.error(error)
        resultDiv.innerHTML = '<p style="color:red">Could not connect to server. Make sure the backend is running.</p>'
    }
}
