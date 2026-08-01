const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function pipeline(commands) {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
        method: 'POST',
        headers: { 
            
            Authorization: `Bearer ${REDIS_TOKEN}`, 
            'Content-Type': 'application/json' 
        },

        body: JSON.stringify(commands)
    })
    return res.json()
}

export async function checkRateLimit(key, max, windowSecs) {
    const now = Date.now()
    const member = `${now}-${Math.random()}`
    const data = await pipeline([
        ['ZREMRANGEBYSCORE', key, '-inf', now - windowSecs * 1000],
        ['ZADD', key, now, member],
        ['ZCARD', key],
        ['EXPIRE', key, windowSecs]
    ])
    return { success: data[2].result <= max }
}

export function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'anonymous'
}
