import crypto from 'crypto'

// 简单的内存 session store（单实例场景够用；重启进程会使所有会话失效）
const sessions = new Map() // token -> { username, expiresAt }
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 天

export const createSession = (username) => {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL })
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
