import { Writable } from 'stream'
import { withFtpClient } from '~/server/utils/ftp.js'
import { getMimeType } from '~/server/utils/file-info.js'

// 直接返回 FTP 文件的二进制内容（图片 / PDF 预览），支持相对当前 FTP 根目录的子目录路径
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const remotePath = query.path || query.name

  if (!remotePath) {
    throw createError({
      statusCode: 400,
      statusMessage: '需要文件名参数 (path 或 name)',
    })
  }

  const buffer = await withFtpClient(async (client) => {
    // 创建可写流来捕获文件数据
    const chunks = []
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    await client.downloadTo(writable, remotePath)
    return Buffer.concat(chunks)
  })

  setHeader(event, 'Content-Type', getMimeType(remotePath))
  setHeader(event, 'Cache-Control', 'private, max-age=3600') // 内容需登录访问，禁止公共缓存

  return buffer
})
