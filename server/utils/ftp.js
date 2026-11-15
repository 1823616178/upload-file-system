import { Client } from 'basic-ftp'

// 轻量 FTP 连接池：
// - 最多 MAX_CLIENTS 个长连接，空闲 IDLE_CLOSE_MS 后自动关闭
// - 超出上限的请求排队等待，避免为每个请求都做一次 FTP 握手+认证
// - 借出期间出错时通过 pwd() 探活，连接失效则丢弃重建，逻辑错误（如 550）不浪费连接
const MAX_CLIENTS = 3
const IDLE_CLOSE_MS = 60 * 1000

const idle = [] // { client, timer }
const waiters = [] // { resolve, reject }
let liveCount = 0 // 空闲 + 借出中的连接总数

const createClient = async () => {
  const config = useRuntimeConfig()
  const client = new Client()

  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      port: config.ftp.port,
      secure: config.ftp.secure
    })

    // 切换到基础路径
    if (config.ftpBasePath) {
      await client.ensureDir(config.ftpBasePath)
      await client.cd(config.ftpBasePath)
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
  return new Promise((resolve, reject) => waiters.push({ resolve, reject }))
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
        const config = useRuntimeConfig()
        if (config.ftpBasePath) await client.cd(config.ftpBasePath)
      } catch {
        healthy = false
      }
    }
    release(client, healthy)
  }
}
