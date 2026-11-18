// 缩略图内存 LRU 缓存，避免历史页刷新时重复向 FTP 拉取完整原图并重新编码
const MAX_ENTRIES = 120
const MAX_TOTAL_BYTES = 24 * 1024 * 1024 // 24MB
const TTL_MS = 10 * 60 * 1000 // 10 分钟

const cache = new Map() // key -> { path, buffer, contentType, expiresAt }
let totalBytes = 0

const deleteEntry = (key) => {
  const entry = cache.get(key)
  if (!entry) return
  totalBytes -= entry.buffer.length
  cache.delete(key)
}

export const getCachedThumbnail = (safePath, size) => {
  const key = `${safePath}:${size}`
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt < Date.now()) {
    deleteEntry(key)
    return null
  }

  // LRU：命中后移到末尾
  cache.delete(key)
  cache.set(key, entry)
  return { buffer: entry.buffer, contentType: entry.contentType }
}

export const setCachedThumbnail = (safePath, size, buffer, contentType) => {
  if (!buffer || buffer.length > 2 * 1024 * 1024) return
  const key = `${safePath}:${size}`
  if (cache.has(key)) {
    deleteEntry(key)
  }

  while (cache.size >= MAX_ENTRIES || totalBytes + buffer.length > MAX_TOTAL_BYTES) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) break
    deleteEntry(oldestKey)
  }

  cache.set(key, {
    path: safePath,
    buffer,
    contentType,
    expiresAt: Date.now() + TTL_MS
  })
  totalBytes += buffer.length
}

export const invalidateThumbnailCache = (safePath) => {
  if (!safePath) {
    cache.clear()
    totalBytes = 0
    return
  }
  for (const [key, entry] of cache) {
    if (entry.path === safePath || entry.path.startsWith(`${safePath}/`)) {
      deleteEntry(key)
    }
  }
}
