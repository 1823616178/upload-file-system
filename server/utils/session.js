import crypto from 'crypto'

// 简单的内存 session store（单实例场景够用；重启进程会使所有会话失效）
const sessions = new Map() // token -> { username, expiresAt }
export const SESSION_TTL_PERSISTENT = 7 * 24 * 60 * 60 * 1000 // 记住我：7 天
export const SESSION_TTL_STANDARD = 24 * 60 * 60 * 1000 // 普通会话：24 小时

export const createSession = (username, ttlMs = SESSION_TTL_PERSISTENT) => {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { username, expiresAt: Date.now() + ttlMs })
  return token
}

export const validateSession = (token) => {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export const destroySession = (token) => {
  if (token) sessions.delete(token)
}

// 定期清扫过期会话：validateSession 只在命中时惰性清理，
// 未再次访问的过期项会一直驻留内存，这里每 6 小时统一清一次
setInterval(() => {
  const now = Date.now()
  for (const [token, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(token)
  }
}, 6 * 60 * 60 * 1000).unref()
