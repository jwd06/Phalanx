import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Mirrors the limits in js/server.js
export const chatLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '25 m'),
    prefix: 'phalanx:chat'
})

export const searchLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '15 m'),
    prefix: 'phalanx:search'
})

export const barcodeLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '15 m'),
    prefix: 'phalanx:barcode'
})

export function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'anonymous'
}
