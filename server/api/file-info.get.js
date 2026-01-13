import { Client } from 'basic-ftp'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.path || '/static/wenjinyangyi'

    const client = new Client()
    let fileList = []

    try {
      await client.access({
        host: '192.168.1.166',
        user: 'userftp',
        password: '550312171',
        port: 21,
        secure: false
      })

      // 获取文件/目录信息
      const files = await client.list(remotePath)

      fileList = files.map(file => ({
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type, // 1 = directory, 2 = file, 0 = unknown
        isDirectory: file.type === 1,
        modifyTime: file.modifyTime,
        remotePath: remotePath.endsWith('/') ? `${remotePath}${file.name}` : `${remotePath}/${file.name}`,
        permissions: file.permissions
      }))
    } catch (ftpError) {
      console.error('FTP 操作失败:', ftpError)
      throw new Error(`无法访问 FTP 服务器: ${ftpError.message}`)
    } finally {
      client.close()
    }

    return {
      success: true,
      data: fileList,
      path: remotePath,
      total: fileList.length
    }
  } catch (error) {
    console.error('获取文件信息失败:', error)
    return {
      success: false,
      error: error.message || '获取文件信息失败'
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
