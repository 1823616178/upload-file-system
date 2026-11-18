import crypto from 'crypto'
import { getRequestIP, readBody, setCookie, setHeader } from 'h3'
import { getUserRepository } from '~/server/utils/db'
import { createRateLimiter } from '~/server/utils/rate-limit'
import {
  createSession,
  SESSION_TTL_PERSISTENT,
  SESSION_TTL_STANDARD
} from '~/server/utils/session'

// 登录防爆破限流：同一 IP 15 分钟内最多允许 10 次失败尝试
const loginFailureLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10
})

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      resolve(false)
      return
    }
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) {
      resolve(false)
      return
    }
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err)
        return
      }
      // 常数时间比较，避免时序侧信道
      const keyBuffer = Buffer.from(key, 'hex')
      const derivedBuffer = derivedKey
      resolve(
        keyBuffer.length === derivedBuffer.length &&
          crypto.timingSafeEqual(keyBuffer, derivedBuffer)
      )
    })
  })
}

export default defineEventHandler(async (event) => {
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
  const limitState = loginFailureLimiter.check(clientIp)
  if (!limitState.allowed) {
    event.res.statusCode = 429
    setHeader(event, 'Retry-After', String(limitState.retryAfterSeconds))
    return { message: `登录尝试过于频繁，请 ${limitState.retryAfterSeconds} 秒后再试` }
  }

  const body = await readBody(event)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const rememberMe = Boolean(body?.rememberMe)

  if (!username || !password) {
    event.res.statusCode = 400
    return { message: '请输入用户名和密码' }
  }

  try {
    const userRepository = await getUserRepository()
    const user = await userRepository.findOne({
      where: { username }
    })

    if (!user) {
      loginFailureLimiter.consume(clientIp)
      event.res.statusCode = 401
      return { message: '用户名或密码错误' }
    }

    const isValid = await verifyPassword(password, user.password)

    if (isValid) {
      loginFailureLimiter.reset(clientIp)

      const ttlMs = rememberMe ? SESSION_TTL_PERSISTENT : SESSION_TTL_STANDARD
      const sessionToken = createSession(user.username, ttlMs)

      const cookieBase = {
        path: '/',
        sameSite: 'strict',
        ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {})
      }

      // session-id: 真正用于服务端鉴权，httpOnly 防止被 XSS 读取
      setCookie(event, 'session-id', sessionToken, {
        ...cookieBase,
        httpOnly: true
      })
      // auth-token: 不携带任何权限，仅供前端路由中间件判断是否已登录
      setCookie(event, 'auth-token', '1', {
        ...cookieBase,
        httpOnly: false
      })
      return { message: '登录成功' }
    } else {
      loginFailureLimiter.consume(clientIp)
      event.res.statusCode = 401
      return { message: '用户名或密码错误' }
    }
  } catch (error) {
    console.error('Login error:', error)
    event.res.statusCode = 500
    return { message: '服务器内部错误' }
  }
})
