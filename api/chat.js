import { checkRateLimit, getIp } from './_ratelimit.js'

const dangerWords = [
    'heart attack', 'heart-attack', 'heartattack',
    'stroke', 'chest pain',
    'suicide', 'suicidal',
    'cannot breathe', 'cant breathe', "can't breathe"
]

const systemPrompt = `You are a helpful fitness coach and nutritionist.

Your goal is to provide FAST, actionable advice.
Follow these rules strictly:
1. START with the direct answer in BOLD.
2. Use a maximum of 3 bullet points for explanation.
3. Max answer of 100-200 words unless explicitly told to give more.
4. Do NOT provide tables unless explicitly asked for.
5. Give food list or what to eat for each meal (e.g., breakfast, lunch, snacks, dinner) based on the context and conversation data.

Safety rules:
1. If the user mentions a life-threatening emergency (heart attack, stroke, etc.) immediately tell them to call 911 or their local emergency services.
2. You are a language model, not a doctor. For specific medical conditions always include a brief disclaimer to consult a healthcare professional.`

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()

    const { success } = await checkRateLimit(`phalanx:chat:${getIp(req)}`, 15, 1500)
    if (!success) return res.status(429).json({ error: 'Session expired. Wait for limit to reset.' })

    if (!process.env.PHALANX_AI) return res.status(503).json({ error: 'AI service not configured' })

    const { message, context } = req.body
    if (!message) return res.status(400).json({ error: 'Missing message' })
    if (typeof message !== 'string' || message.length > 2000) return res.status(400).json({ error: 'Message too long' })
    if (context !== undefined && (typeof context !== 'string' || context.length > 3000)) return res.status(400).json({ error: 'Context too long' })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    if (dangerWords.some(w => message.toLowerCase().includes(w))) {
        res.write(`data: ${JSON.stringify('Please call 911 or your local emergency services immediately. This AI cannot provide emergency medical assistance.')}\n\n`)
        res.write('data: [DONE]\n\n')
        return res.end()
    }

    let fullPrompt = systemPrompt
    if (context) fullPrompt += `\n\nHere is the user's current app data:\n${context}`

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PHALANX_AI}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b:free',
                messages: [
                    { role: 'system', content: fullPrompt },
                    { role: 'user', content: message }
                ],
                stream: true
            })
        })

        if (!upstream.ok) {
            res.write(`data: ${JSON.stringify('AI service unavailable. Please try again later.')}\n\n`)
            res.write('data: [DONE]\n\n')
            return res.end()
        }

        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop()
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const payload = line.slice(6).trim()
                if (payload === '[DONE]') break
                try {
                    const delta = JSON.parse(payload).choices[0].delta.content ?? ''
                    if (delta) res.write(`data: ${JSON.stringify(delta)}\n\n`)
                } catch {}
            }
        }
    } catch (error) {
        console.error(error)
        res.write(`data: ${JSON.stringify('Error connecting to AI service.')}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
}
