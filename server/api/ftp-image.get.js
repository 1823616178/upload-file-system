import { Writable } from 'stream'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filePath = query.path

  if (!filePath) {
    throw createError({
      statusCode: 400,
      statusMessage: '需要文件路径参数 (path)',
    })
  }

  const client = await createFtpClient()

  try {
    // 创建可写流来捕获文件数据
    const chunks = []
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    // 从 FTP 下载文件到流
    await client.downloadTo(writable, filePath)
    
    const buffer = Buffer.concat(chunks)

    // 确定 Content-Type
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    }
    
    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext]
    }

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // 缓存 1 小时

    return buffer
  } catch (err) {
    console.error('FTP 图片获取失败:', err)
    throw createError({
      statusCode: 500,
      statusMessage: '获取图片失败',
    })
  } finally {
    client.close()
  }
})
