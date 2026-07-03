import { Writable } from 'stream'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const remotePath = query.path

  if (!remotePath) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少文件路径参数',
      message: '缺少文件路径参数',
    })
  }

  const fileName = remotePath.split('/').pop()
  const client = await createFtpClient()

  try {
    const chunks = []
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    await client.downloadTo(writable, remotePath)
    const buffer = Buffer.concat(chunks)

    setHeader(event, 'Content-Type', getMimeType(fileName))
    setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    setHeader(event, 'Content-Length', buffer.length)

    return buffer
  } catch (err) {
    console.error('FTP 下载失败:', err)
    throw createError({
      statusCode: 500,
      statusMessage: '下载文件失败',
      message: '下载文件失败',
    })
  } finally {
    client.close()
  }
})

// 根据文件名获取 MIME 类型
const getMimeType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'json': 'application/json',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}
