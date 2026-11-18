import crypto from 'crypto'
import { createError, getRequestHeader, getRequestIP, setHeader, setResponseStatus } from 'h3'
import { createRateLimiter } from './rate-limit'

// 对外开放接口（/api/v1/*）鉴权、限流与统一响应封装
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 分钟
  max: 120 // 每 API Key / IP 每分钟最多 120 次请求
})

const sha256Digest = (value) => crypto.createHash('sha256').update(String(value)).digest()

// 解析 NUXT_API_KEYS（格式："key1,key2" 或 "clientA:key1,clientB:key2"）
export const getConfiguredApiKeys = () => {
  const config = useRuntimeConfig()
  const raw = String(config.apiKeys || '').trim()
  if (!raw) return []

  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map((entry, idx) => {
      const colonIdx = entry.indexOf(':')
      if (colonIdx > 0) {
        return {
          name: entry.slice(0, colonIdx).trim() || `client_${idx + 1}`,
          key: entry.slice(colonIdx + 1).trim(),
          digest: sha256Digest(entry.slice(colonIdx + 1).trim())
        }
      }
      return {
        name: `client_${idx + 1}`,
        key: entry,
        digest: sha256Digest(entry)
      }
    })
    .filter(item => item.key.length > 0)
}

export const extractApiKey = (event) => {
  const headerKey = getRequestHeader(event, 'x-api-key')
  if (headerKey && headerKey.trim()) {
    return headerKey.trim()
  }

  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}

export const authenticateApiRequest = (event) => {
  const configured = getConfiguredApiKeys()
  if (configured.length === 0) {
    throw createError({
      statusCode: 503,
      message: '对外接口未启用：服务端尚未配置 NUXT_API_KEYS'
    })
  }

  const provided = extractApiKey(event)
  if (!provided) {
    throw createError({
      statusCode: 401,
      message: '缺少 API 访问密钥（请通过 X-API-Key 或 Authorization: Bearer 传递）'
    })
  }

  const providedDigest = sha256Digest(provided)
  let matchedClient = null
  for (const candidate of configured) {
    if (crypto.timingSafeEqual(providedDigest, candidate.digest)) {
      matchedClient = candidate
    }
  }

  if (!matchedClient) {
    throw createError({
      statusCode: 401,
      message: 'API 密钥无效'
    })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
  const limitKey = `${matchedClient.name}:${ip}`
  const limitState = apiRateLimiter.consume(limitKey)

  setHeader(event, 'X-RateLimit-Limit', String(limitState.limit))
  setHeader(event, 'X-RateLimit-Remaining', String(limitState.remaining))
  setHeader(event, 'X-RateLimit-Reset', String(Math.ceil(limitState.resetAt / 1000)))

  if (!limitState.allowed) {
    setHeader(event, 'Retry-After', String(limitState.retryAfterSeconds))
    throw createError({
      statusCode: 429,
      message: '请求过于频繁，请稍后重试'
    })
  }

  event.context.apiClient = {
    name: matchedClient.name,
    ip
  }

  return event.context.apiClient
}

export const apiOk = (event, data = null, message = 'ok', statusCode = 200) => {
  setResponseStatus(event, statusCode)
  return {
    code: 0,
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }
}

export const handleOpenApiError = (event, error) => {
  const statusCode = Number(error?.statusCode) || 500
  const message = error?.message || error?.statusMessage || '服务器内部错误'
  setResponseStatus(event, statusCode)
  return {
    code: statusCode,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString()
  }
}
