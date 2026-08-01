import { checkRateLimit, getIp } from './_ratelimit.js'

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

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end()

    try {
        const { success } = await checkRateLimit(`phalanx:search:${getIp(req)}`, 60, 900)
        if (!success) return res.status(429).json({ error: 'Too many search requests. Please slow down.' })
    } catch {
        // Redis unavailable — fail open
    }

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
}
