import { Client } from 'basic-ftp'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.path

    if (!remotePath) {
      throw new Error('缺少文件路径参数')
    }

    const client = new Client()

    try {
      await client.access({
        host: '192.168.1.166',
        user: 'userftp',
        password: '550312171',
        port: 21,
        secure: false
      })

      // 获取父目录路径
      const lastSlashIndex = remotePath.lastIndexOf('/')
      const dirPath = lastSlashIndex !== -1 ? remotePath.substring(0, lastSlashIndex) || '/' : '/'
      const fileName = remotePath.split('/').pop()

      // 获取父目录文件列表
      const fileList = await client.list(dirPath)

      // 查找请求的文件
      const file = fileList.find(f => f.name === fileName)

      if (!file) {
        throw new Error('文件不存在')
      }

      // 如果是目录，返回文件列表
      if (file.type === 1) {
        const files = await client.list(remotePath)
        return {
          success: true,
          isDirectory: true,
          data: {
            path: remotePath,
            files: files.map(f => ({
              name: f.name,
              size: f.size,
              sizeFormatted: formatFileSize(f.size),
              type: f.type,
              isDirectory: f.type === 1,
              modifyTime: f.modifyTime,
              fullPath: `${remotePath}/${f.name}`.replace('//', '/')
            }))
          }
        }
      } else {
        // 如果是文件，读取文件内容（用于预览）
        const buffer = await client.downloadToBuffer(remotePath)
        const base64 = buffer.toString('base64')
        const mimeType = getMimeType(fileName)

        return {
          success: true,
          isDirectory: false,
          data: {
            path: remotePath,
            name: fileName,
            size: file.size,
            sizeFormatted: formatFileSize(file.size),
            type: mimeType,
            modifyTime: file.modifyTime,
            base64: base64,
            previewUrl: `data:${mimeType};base64,${base64}`
          }
        }
      }
    } catch (ftpError) {
      console.error('FTP 操作失败:', ftpError)
      throw new Error(`无法访问 FTP 服务器: ${ftpError.message}`)
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('获取 FTP 文件失败:', error)
    return {
      success: false,
      error: error.message || '获取文件失败'
    }
  }
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

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
    'txt': 'text/plain',
    'json': 'application/json'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}
