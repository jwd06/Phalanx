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
            <button class = "collapsible">${food.nameFood}</button>
            <div class = "content">
                <br><em>Per ${food.serving}</em><br>
                <ul>
                    <li>Calories: ${food.calories} kcal</li>
                    <li>Protein: ${food.protein}g</li>
                    <li>Carbs: ${food.carbs}g</li>
                    <li>Fat: ${food.fat}g</li>
                </ul>
            </div>
        `).join('<br>')
    } catch (error) {
        console.error(error)
        const msg = error.name === 'AbortError'
            ? 'Request timed out. Try again.'
            : 'Could not connect to server.'
        resultDiv.innerHTML = `<p style="color:red">${msg}</p>`
    }
}

document.getElementById('result-nutrients').addEventListener('click', function(e) {
    if (!e.target.classList.contains('collapsible')) return
    e.target.classList.toggle('active')
    var content = e.target.nextElementSibling
    if (content.style.maxHeight) {
        content.style.maxHeight = null
    } else {
        content.style.maxHeight = content.scrollHeight + 'px'
    }
})
