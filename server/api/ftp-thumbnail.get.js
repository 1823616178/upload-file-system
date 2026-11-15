import { Writable } from 'stream'
import sharp from 'sharp'
import { withFtpClient } from '~/server/utils/ftp.js'
import { getExtension, IMAGE_EXTENSIONS } from '~/server/utils/file-info.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fileName = query.path || query.name

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: '需要文件名参数 (path 或 name)',
    })
  }

  // 检查是否为图片文件
  const ext = getExtension(fileName).replace('.', '')
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    throw createError({
      statusCode: 400,
      statusMessage: '非图片文件，无法生成缩略图',
    })
  }

  // 尺寸限制在 16-512，防止恶意大尺寸请求占用内存/CPU
  const requestedSize = parseInt(query.size) || 120
  const thumbnailSize = Math.min(512, Math.max(16, requestedSize))

  const thumbnailBuffer = await withFtpClient(async (client) => {
    // 创建可写流来捕获文件数据
    const chunks = []
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    await client.downloadTo(writable, fileName)
    const buffer = Buffer.concat(chunks)

    // 使用 sharp 压缩生成缩略图
    let sharpInstance = sharp(buffer)

    // 根据原图格式处理
    if (ext === 'png' || ext === 'gif') {
      // gif 只取第一帧
      sharpInstance = sharpInstance.png({ quality: 80 })
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true })
    }

    return sharpInstance
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer()
  })

  // 确定 Content-Type
  let contentType = 'image/jpeg'
  if (ext === 'png' || ext === 'gif') {
    contentType = 'image/png'
  } else if (ext === 'webp') {
    contentType = 'image/webp'
  }

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'private, max-age=3600') // 内容需登录访问，禁止公共缓存

  return thumbnailBuffer
})
