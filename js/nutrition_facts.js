async function nutritionFacts() {
    const name = document.getElementById('food-name').value.trim()
    const resultDiv = document.getElementById('result-nutrients')

    if (!name) {
        resultDiv.innerHTML = '<p style="color:red">Please enter a food name.</p>'
        return
    }

    resultDiv.innerHTML = '<p>Searching...</p>'

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(`/api/search?food=${encodeURIComponent(name)}`, { signal: controller.signal })
        clearTimeout(timeout)

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
        const msg = error.name === 'AbortError'
            ? 'Request timed out. Try again.'
            : 'Could not connect to server. Make sure the backend is running.'
        resultDiv.innerHTML = `<p style="color:red">${msg}</p>`
    }
}
