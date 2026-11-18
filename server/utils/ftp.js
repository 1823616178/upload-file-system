import path from 'path'
import { PassThrough } from 'stream'
import { Client } from 'basic-ftp'
import { createError, sendStream, setHeader } from 'h3'

// 轻量 FTP 连接池：
// - 最多 MAX_CLIENTS 个长连接，空闲 IDLE_CLOSE_MS 后自动关闭
// - 超出上限的请求排队等待（带超时保护），避免为每个请求都做一次 FTP 握手+认证
// - 借出期间出错时通过 pwd() 探活，连接失效则丢弃重建，逻辑错误（如 550）不浪费连接
const MAX_CLIENTS = 3
const IDLE_CLOSE_MS = 60 * 1000
const ACQUIRE_TIMEOUT_MS = 20 * 1000
const FTP_SOCKET_TIMEOUT_MS = 30 * 1000

const idle = [] // { client, timer }
const waiters = [] // { resolve, reject }
let liveCount = 0 // 空闲 + 借出中的连接总数

// 根目录文件列表短期缓存（供 /api/history 与 /api/v1/history 复用）
const FTP_LIST_CACHE_TTL = 30 * 1000
let ftpListCache = null // { data, expiresAt }
let inFlightListPromise = null
let listCacheGeneration = 0

export const getFtpBasePath = () => {
  const config = useRuntimeConfig()
  const raw = config.ftpBasePath || '/static/zhonghuaguji/wenjinyangji'
  const normalized = path.posix.normalize(raw).replace(/\/+$/, '')
  return normalized || '/'
}

export const getFullRemotePath = (safeRelativePath) => {
  const base = getFtpBasePath().replace(/\/+$/, '')
  if (!safeRelativePath || safeRelativePath === '.') {
    return base || '/'
  }
  return `${base}/${safeRelativePath}`.replace(/\/{2,}/g, '/')
}

export const isFtpNotFoundError = (error) => {
  return error?.code === 550 || /\b550\b|no such file|not found|failed to open|can't check for file existence/i.test(error?.message || '')
}

// 统一将前端或外部传入的路径规范化为相对于 ftpBasePath 的安全 POSIX 路径，防止目录穿越
export const resolveSafeFtpPath = (inputPath, { allowRoot = false } = {}) => {
  if (inputPath === undefined || inputPath === null) {
    if (allowRoot) return '.'
    throw createError({ statusCode: 400, message: '缺少文件路径参数' })
  }

  const raw = String(inputPath).trim()
  if (raw.includes('\0') || raw.includes('\\')) {
    throw createError({ statusCode: 400, message: '路径包含非法字符' })
  }

  if (!raw || raw === '.' || raw === './') {
    if (allowRoot) return '.'
    throw createError({ statusCode: 400, message: '不能直接操作根目录' })
  }

  if (raw.startsWith('/')) {
    const base = getFtpBasePath()
    const normAbs = path.posix.normalize(raw).replace(/\/+$/, '') || '/'

    if (normAbs === base) {
      if (allowRoot) return '.'
      throw createError({ statusCode: 400, message: '不能直接操作根目录' })
    }

    if (base === '/' || normAbs.startsWith(`${base}/`)) {
      const rel = base === '/' ? normAbs.slice(1) : normAbs.slice(base.length + 1)
      if (!rel) {
        if (allowRoot) return '.'
        throw createError({ statusCode: 400, message: '不能直接操作根目录' })
      }
      if (rel === '..' || rel.startsWith('../') || path.posix.isAbsolute(rel)) {
        throw createError({ statusCode: 400, message: '非法路径：禁止越权访问' })
      }
      return rel
    }

    throw createError({ statusCode: 400, message: '非法路径：禁止访问基准目录之外的路径' })
  }

  const normRel = path.posix.normalize(raw).replace(/\/+$/, '')
  if (!normRel || normRel === '.') {
    if (allowRoot) return '.'
    throw createError({ statusCode: 400, message: '不能直接操作根目录' })
  }
  if (normRel === '..' || normRel.startsWith('../') || path.posix.isAbsolute(normRel)) {
    throw createError({ statusCode: 400, message: '非法路径：不允许越级访问' })
  }

  return normRel
}

const createClient = async () => {
  const config = useRuntimeConfig()
  const client = new Client(FTP_SOCKET_TIMEOUT_MS)

  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      port: config.ftp.port,
      secure: config.ftp.secure
    })

    const basePath = getFtpBasePath()
    if (basePath) {
      await client.ensureDir(basePath)
      await client.cd(basePath)
    }

    return client
  } catch (error) {
    client.close()
    throw new Error(`FTP connection failed: ${error.message}`)
  }
}

const scheduleIdleClose = () => {
  const timer = setTimeout(() => {
    const index = idle.findIndex(entry => entry.timer === timer)
    if (index !== -1) {
      idle[index].client.close()
      idle.splice(index, 1)
      liveCount--
    }
  }, IDLE_CLOSE_MS)
  timer.unref?.()
  return timer
}

const acquire = async () => {
  const entry = idle.pop()
  if (entry) {
    clearTimeout(entry.timer)
    return entry.client
  }
  if (liveCount < MAX_CLIENTS) {
    liveCount++
    try {
      return await createClient()
    } catch (error) {
      liveCount--
      throw error
    }
  }

  return new Promise((resolve, reject) => {
    const waiter = {
      resolve: (client) => {
        clearTimeout(timer)
        resolve(client)
      },
      reject: (error) => {
        clearTimeout(timer)
        reject(error)
      }
    }

    const timer = setTimeout(() => {
      const idx = waiters.indexOf(waiter)
      if (idx !== -1) {
        waiters.splice(idx, 1)
      }
      reject(createError({
        statusCode: 503,
        message: 'FTP 连接池繁忙，请稍后重试'
      }))
    }, ACQUIRE_TIMEOUT_MS)
    timer.unref?.()

    waiters.push(waiter)
  })
}

const release = (client, healthy) => {
  if (healthy) {
    const waiter = waiters.shift()
    if (waiter) {
      waiter.resolve(client)
      return
    }
    idle.push({ client, timer: scheduleIdleClose() })
    return
  }

  try { client.close() } catch { /* 连接可能已断开 */ }
  const waiter = waiters.shift()
  if (waiter) {
    createClient().then(waiter.resolve, error => {
      liveCount--
      waiter.reject(error)
    })
    return
  }
  liveCount--
}

// 在池化连接上执行回调，返回回调结果
export const withFtpClient = async (fn) => {
  const client = await acquire()
  let healthy = true
  try {
    return await fn(client)
  } catch (error) {
    // 通过 pwd() 探活：控制连接仍可用则保留复用，否则标记为失效
    try {
      await client.pwd()
    } catch {
      healthy = false
    }
    throw error
  } finally {
    // 个别操作（ensureDir/removeDir）会改变工作目录，归还前统一切回基础路径
    if (healthy) {
      try {
        const basePath = getFtpBasePath()
        if (basePath) await client.cd(basePath)
      } catch {
        healthy = false
      }
    }
    release(client, healthy)
  }
}

export const getCachedFtpList = async () => {
  if (ftpListCache && Date.now() < ftpListCache.expiresAt) {
    return ftpListCache.data
  }
  if (inFlightListPromise) {
    return inFlightListPromise
  }

  const gen = listCacheGeneration
  inFlightListPromise = withFtpClient(async (client) => client.list())
    .then((data) => {
      if (gen === listCacheGeneration) {
        ftpListCache = { data, expiresAt: Date.now() + FTP_LIST_CACHE_TTL }
      }
      return data
    })
    .finally(() => {
      inFlightListPromise = null
    })

  return inFlightListPromise
}

export const invalidateFtpListCache = () => {
  listCacheGeneration++
  ftpListCache = null
}

// 流式下载 FTP 文件到 HTTP 响应，避免大文件完整缓存在内存中造成 OOM；
// 同时在首包/EOF 到达后才写入响应头并 sendStream，保证 404/异常能正确返回 HTTP 状态码
export const streamFtpFile = async (event, safePath, options = {}) => {
  const passThrough = new PassThrough({ highWaterMark: 256 * 1024 })
  let fileSize = null
  let readySettled = false
  let resolveReady
  let rejectReady

  const readyPromise = new Promise((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const markReady = () => {
    if (!readySettled) {
      readySettled = true
      resolveReady()
    }
  }

  const markFailed = (error) => {
    if (!readySettled) {
      readySettled = true
      rejectReady(error)
    }
  }

  passThrough.once('readable', markReady)
  passThrough.once('end', markReady)

  passThrough.abort = () => {
    if (!passThrough.destroyed) {
      passThrough.destroy(new Error('Client disconnected'))
    }
  }

  const transferPromise = withFtpClient(async (client) => {
    try {
      fileSize = await client.size(safePath)
    } catch {
      fileSize = null
    }
    await client.downloadTo(passThrough, safePath)
  }).catch((error) => {
    const mapped = isFtpNotFoundError(error)
      ? createError({ statusCode: 404, message: '文件不存在' })
      : createError({ statusCode: 502, message: `文件读取失败: ${error.message}` })

    markFailed(mapped)
    if (!passThrough.destroyed) {
      passThrough.destroy(mapped)
    }
  })

  await readyPromise

  if (options.contentType) {
    setHeader(event, 'Content-Type', options.contentType)
  }
  if (options.disposition && options.filename) {
    const encoded = encodeURIComponent(options.filename)
    const asciiFallback = options.filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
    setHeader(
      event,
      'Content-Disposition',
      `${options.disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
    )
  }
  if (typeof fileSize === 'number' && Number.isFinite(fileSize) && fileSize >= 0) {
    setHeader(event, 'Content-Length', fileSize)
  }
  if (options.extraHeaders) {
    for (const [headerName, headerValue] of Object.entries(options.extraHeaders)) {
      setHeader(event, headerName, headerValue)
    }
  }

  try {
    await sendStream(event, passThrough)
  } finally {
    await transferPromise.catch(() => {})
  }
}
