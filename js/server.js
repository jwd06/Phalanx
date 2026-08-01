import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import rateLimit from 'express-rate-limit'

const app = express() //Creates an instance of an Express application.
const PORT = 3000



//rate-limiter for Phalanx AI Copilot (OpenAi API)
const phalanxCopilotLimiter = rateLimit({
    max: 15, //max # of request
    windowMs: 25 * 60 * 1000, //25minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Session expired. Wait for limit to reset'
})

//rate-limiter for Nutrition
const searchFood = rateLimit({
    max: 60, //60 requests
    windowMs: 15 * 60 * 1000, //15minutes
    standardHeaders: true,
    legacyHeaders: false,
    message:'Too many search requests. Please slow down'

})

//rate-limiter for barcode
const barCodeScanner = rateLimit({
    max: 30,
    windowMs: 15 * 60 * 1000, //15minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many barcode requests. Please slow down'
})

app.use(cors())
app.use(express.json())

app.post('/api/chat', phalanxCopilotLimiter, (req, res) => {
    const { message, context } = req.body

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const py = spawn('python3', ['api/phalanxAi.py'])
    py.stdin.write(JSON.stringify({ message, context }))
    py.stdin.end()

    
    py.stdout.on('data', chunk => res.write(`data: ${JSON.stringify(chunk.toString())}\n\n`))
   

    py.stderr.on('data', err => console.error('Python error:', err.toString()))

    py.on('close', () => {
        res.write('data: [DONE]\n\n')
        res.end()
    })
    py.on('error', () => {
        res.write('data: [DONE]\n\n')
        res.end()
    })
     
})

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken
    const creds = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=basic'
    })
    if (!res.ok) throw new Error('FatSecret token request failed')
    const data = await res.json()
    cachedToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return cachedToken
}

async function getFoodDetail(foodId, token) {
    const url = new URL('https://platform.fatsecret.com/rest/server.api')
    url.searchParams.set('method', 'food.get.v4')
    url.searchParams.set('food_id', foodId)
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.food ?? null
}

app.get('/api/search', searchFood, async (req, res) => {
    const foodName = req.query.food
    if (!foodName) return res.status(400).json({ error: 'Missing food parameter' })
    if (foodName.length > 200) return res.status(400).json({ error: 'Query too long' })

    try {
        const token = await getAccessToken()

        const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api')
        searchUrl.searchParams.set('method', 'foods.search')
        searchUrl.searchParams.set('search_expression', foodName)
        searchUrl.searchParams.set('format', 'json')
        searchUrl.searchParams.set('max_results', '10')

        const searchRes = await fetch(searchUrl.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!searchRes.ok) throw new Error('FatSecret search failed')

        const searchData = await searchRes.json()
        const rawFoods = searchData.foods?.food
        if (!rawFoods) return res.status(404).json({ message: 'No food found' })

        const foodList = Array.isArray(rawFoods) ? rawFoods : [rawFoods]

        const details = await Promise.all(foodList.map(f => getFoodDetail(f.food_id, token)))

        const results = details
            .filter(Boolean)
            .map(food => {
                const raw = food.servings?.serving
                const servings = Array.isArray(raw) ? raw : (raw ? [raw] : [])

                const base = servings.find(s => s.serving_description?.toLowerCase().includes('100g'))
                    ?? servings[0]
                    ?? {}

                const portions = servings
                    .filter(s => s.metric_serving_amount && parseFloat(s.metric_serving_amount) > 0)
                    .map(s => ({
                        description: s.serving_description,
                        gramWeight: parseFloat(s.metric_serving_amount)
                    }))

                return {
                    nameFood: food.food_name,
                    calories: Math.round(parseFloat(base.calories) || 0),
                    protein: Math.round(parseFloat(base.protein) || 0),
                    carbs: Math.round(parseFloat(base.carbohydrate) || 0),
                    fat: Math.round(parseFloat(base.fat) || 0),
                    portions: portions.length > 0 ? portions : [{ description: '100g', gramWeight: 100 }]
                }
            })

        if (results.length === 0) return res.status(404).json({ message: 'No food found' })
        res.json(results)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})


app.get('/api/barcode', barCodeScanner, async (req, res) => {
    const upc = req.query.upc
    if (!upc || !/^\d{8,14}$/.test(upc)) {return res.status(400).json({ error: 'Missing or Invalid UPC'})}

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(upc)}.json`,
            { headers: {'User-Agent': 'Phalanx-App/1.0'}}
        )

        if (!response.ok) { return res.status(503).json({ error: 'Upstream service unavailable'})}

        const data = await response.json()
        if (data.status !== 1 || !data.product) { return res.status(404).json({ message: 'Food not found'})}

        const product = data.product
        const nutrients = product.nutriments || {}

        res.json([{
            nameFood: product.product_name || product.product_name_en || `Product ${upc}`,
            calories: Math.round(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal'] ?? 0),
            protein: Math.round(nutrients['proteins_100g'] ?? nutrients['proteins'] ?? 0),
            carbs: Math.round(nutrients['carbohydrates_100g'] ?? nutrients['carbohydrates'] ?? 0),
            fat: Math.round(nutrients['fat_100g'] ?? nutrients['fat'] ?? 0),
            portions: [{description: '100g', gramWeight: 100}]
        }])
    }

    catch(error) {
        console.error(error)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

app.listen(PORT, '0.0.0.0', () => console.log(`Backend server running on port ${PORT}`))
