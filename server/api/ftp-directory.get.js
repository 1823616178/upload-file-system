
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    // 使用 '.' 表示当前目录（即 ftpBasePath 设置的目录）
    const remotePath = query.path || '.'

    const client = await createFtpClient()

    try {
      // 获取目录列表
      const fileList = await client.list(remotePath)
      
      // 调试日志：查看 FTP 返回的原始数据
      if (fileList.length > 0) {
        console.log('FTP 文件列表样例:', JSON.stringify(fileList[0], null, 2))
      }

      const files = fileList.map(file => {
        // basic-ftp 中 type 的含义：
        // 0 = unknown, 1 = file, 2 = directory, 3 = symbolic link
        const isDir = file.isDirectory === true || file.type === 2
        
        return {
          name: file.name,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          type: file.type,
          isDirectory: isDir,
          modifyTime: file.modifyTime,
          permissions: file.permissions,
          fullPath: remotePath === '.' 
            ? file.name
            : (remotePath.endsWith('/') ? `${remotePath}${file.name}` : `${remotePath}/${file.name}`)
        }
      })

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
