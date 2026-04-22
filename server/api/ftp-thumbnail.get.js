import { Writable } from 'stream'
import sharp from 'sharp'

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
  const ext = fileName.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  if (!imageExts.includes(ext)) {
    throw createError({
      statusCode: 400,
      statusMessage: '非图片文件，无法生成缩略图',
    })
  }

  const config = useRuntimeConfig()
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

    // FTP 客户端已经在 ftp.js 中切换到根目录，直接使用文件名
    await client.downloadTo(writable, fileName)

    const buffer = Buffer.concat(chunks)

    // 使用 sharp 压缩生成缩略图
    const thumbnailSize = parseInt(query.size) || 120
    let sharpInstance = sharp(buffer)

    // 根据原图格式处理
    if (ext === 'png') {
      sharpInstance = sharpInstance.png({ quality: 80 })
    } else if (ext === 'gif') {
      // gif 只取第一帧
      sharpInstance = sharpInstance.png({ quality: 80 })
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true })
    }

    const thumbnailBuffer = await sharpInstance
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer()

    // 确定 Content-Type
    let contentType = 'image/jpeg'
    if (ext === 'png' || ext === 'gif') {
      contentType = 'image/png'
    } else if (ext === 'webp') {
      contentType = 'image/webp'
    }

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // 缓存 1 小时

    return thumbnailBuffer
  } catch (err) {
    console.error('FTP 缩略图获取失败:', err)
    throw createError({
      statusCode: 500,
      statusMessage: '获取缩略图失败',
    })
  } finally {
    client.close()
  }
})
