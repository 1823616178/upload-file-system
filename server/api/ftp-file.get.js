
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.path

    if (!remotePath) {
      throw new Error('缺少文件路径参数')
    }

    console.log('FTP 获取文件，路径:', remotePath)

    const client = await createFtpClient()

    try {
      // 处理路径：如果是 '.' 开头或直接是文件名，直接使用
      let dirPath = '.'
      let fileName = remotePath
      
      if (remotePath.includes('/')) {
        const lastSlashIndex = remotePath.lastIndexOf('/')
        dirPath = remotePath.substring(0, lastSlashIndex) || '.'
        fileName = remotePath.substring(lastSlashIndex + 1)
      }
      
      console.log('解析后 - 目录:', dirPath, '文件名:', fileName)

      // 获取父目录文件列表
      const fileList = await client.list(dirPath)

      // 查找请求的文件
      const file = fileList.find(f => f.name === fileName)

      if (!file) {
        console.error(`文件不存在: ${fileName}, 目录: ${dirPath}`)
        console.error('目录中的文件:', fileList.map(f => f.name))
        throw new Error('文件不存在')
      }

      // 判断是否为目录：type === 2 或 isDirectory === true
      const isDir = file.isDirectory === true || file.type === 2
      
      if (isDir) {
        // 如果是目录，返回文件列表
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
              isDirectory: f.isDirectory === true || f.type === 2,
              modifyTime: f.modifyTime,
              fullPath: `${remotePath}/${f.name}`.replace('//', '/')
            }))
          }
        }
      } else {
        // 如果是文件，读取文件内容（用于预览）
        console.log('开始下载文件:', remotePath)
        
        // 使用 Writable 流收集数据
        const chunks = []
        const writableStream = new (await import('stream')).Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk)
            callback()
          }
        })
        
        await client.downloadTo(writableStream, remotePath)
        const buffer = Buffer.concat(chunks)
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
