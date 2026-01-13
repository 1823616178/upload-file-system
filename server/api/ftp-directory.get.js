
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.path || '/static/wenjinyangyi'

    const client = await createFtpClient()

    try {
      // 获取目录列表
      const fileList = await client.list(remotePath)

      const files = fileList.map(file => ({
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type,
        isDirectory: file.type === 1,
        modifyTime: file.modifyTime,
        permissions: file.permissions,
        fullPath: remotePath.endsWith('/')
          ? `${remotePath}${file.name}`
          : `${remotePath}/${file.name}`
      }))

      return {
        success: true,
        data: {
          path: remotePath,
          files: files,
          total: files.length,
          directories: files.filter(f => f.isDirectory).length,
          filesCount: files.filter(f => !f.isDirectory).length
        }
      }
    } catch (ftpError) {
      console.error('FTP 操作失败:', ftpError)
      throw new Error(`无法访问 FTP 服务器: ${ftpError.message}`)
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('获取 FTP 目录失败:', error)
    return {
      success: false,
      error: error.message || '获取目录失败'
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
