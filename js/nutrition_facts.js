async function nutritionFacts() {
    const name = document.getElementById('food-name').value.trim()
    const resultDiv = document.getElementById('result-nutrients')

    if (!name) {
        resultDiv.innerHTML = '<p style="color:red">Please enter a food name.</p>'
        return
    }

    resultDiv.innerHTML = '<p>Searching...</p>'
// Set this to your backend tunnel URL (e.g., https://cool-panda.loca.lt) when testing on phone via ngrok
const TUNNEL_URL = ''

    const API_BASE = TUNNEL_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/))
        ? `http://${window.location.hostname}:3000`
        : ''); // Empty string for Vercel (relative path)

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        //const response = await fetch(`/api/search?food=${encodeURIComponent(name)}`, { signal: controller.signal })
        const response = await fetch(`${API_BASE}/api/search?food=${encodeURIComponent(name)}`, { signal: controller.signal })
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
                <div class="food-data"
                    data-calories="${food.calories}"
                    data-protein="${food.protein}"
                    data-carbs="${food.carbs}"
                    data-fat="${food.fat}"
                >
                <br>
                <label>Portion: 
                    <select class="portion-select">
                        ${food.portions.map((p, i)=>
                            `<option value="${p.gramWeight}" ${i === 0 ? 'selected' : ''}>${p.description} (${p.gramWeight} g)</option>`
                        ).join('')}
                    </select>
                </label>
                <label class="custom-serving-label">
                    Serving size: <input type="number" class="custom-serving-input" min="1" placeholder="e.g. 50"> g
                </label>
                <ul>
                    <li><i class="fa-solid fa-fire"></i> Calories: <span class="cal">${food.calories}</span> kcal</li>   
                    <li><i class="fa-solid fa-drumstick-bite"></i> Protein: <span class="pro">${food.protein}</span> g</li>   
                    <li><i class="fa-solid fa-bread-slice"></i> Carbs: <span class="carb">${food.carbs}</span> g</li>   
                    <li><i class="fa-solid fa-cheese"></i> Fat: <span class="fat">${food.fat}</span> g</li> 
                </ul>  
                </div>
            </div>
        `).join('<br>')
    } catch (error) {
        console.error(error)
        const msg = error.name === 'AbortError'
            ? 'Request timed out. Try again.'
            : 'Could not connect to server. Try again'
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

document.getElementById('result-nutrients').addEventListener('change', function(r) {
    if (!r.target.classList.contains('portion-select')) return
    const gramWeight = Number(r.target.value)
    const content = r.target.closest('.food-data')
    const scale = gramWeight / 100

    content.querySelector('.cal').textContent = Math.round(content.dataset.calories * scale)
    content.querySelector('.pro').textContent  = Math.round(content.dataset.protein * scale)
    content.querySelector('.carb').textContent = Math.round(content.dataset.carbs * scale)
    content.querySelector('.fat').textContent  = Math.round(content.dataset.fat * scale)

    //syncing custom serving input 
    const customInput = content.querySelector('.custom-serving-input')
    if (customInput) customInput.value = gramWeight
})

document.getElementById('result-nutrients').addEventListener('input', function(i) {
    if (!i.target.classList.contains('custom-serving-input')) return
    const grams = Number(i.target.value)
    if (!grams || grams <= 0) return
    const content = i.target.closest('.food-data')
    const scale = grams / 100

    content.querySelector('.cal').textContent  = Math.round(content.dataset.calories * scale)
    content.querySelector('.pro').textContent  = Math.round(content.dataset.protein * scale)
    content.querySelector('.carb').textContent = Math.round(content.dataset.carbs * scale)
    content.querySelector('.fat').textContent  = Math.round(content.dataset.fat * scale)

})
