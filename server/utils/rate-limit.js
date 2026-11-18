// 轻量内存滑动窗口限流器，用于登录防爆破与对外接口限流
export const createRateLimiter = ({ windowMs, max }) => {
  const buckets = new Map() // key -> { count, resetAt }

  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) {
        buckets.delete(key)
      }
    }
  }, Math.max(windowMs, 60 * 1000)).unref?.()

  const check = (key) => {
    const now = Date.now()
    let entry = buckets.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      buckets.set(key, entry)
    }

    const remaining = Math.max(0, max - entry.count)
    return {
      allowed: entry.count < max,
      remaining,
      limit: max,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    }
  }

  const consume = (key) => {
    const now = Date.now()
    let entry = buckets.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      buckets.set(key, entry)
    }
    entry.count++
    return {
      allowed: entry.count <= max,
      remaining: Math.max(0, max - entry.count),
      limit: max,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    }
  }

  const reset = (key) => {
    buckets.delete(key)
  }

  return { check, consume, reset }
}
