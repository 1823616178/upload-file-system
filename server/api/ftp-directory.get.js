import { withFtpClient } from '~/server/utils/ftp.js'
import { formatFileSize } from '~/server/utils/file-info.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    // 使用 '.' 表示当前目录（即 ftpBasePath 设置的目录）
    const remotePath = query.path || '.'

    const files = await withFtpClient(async (client) => {
      // 获取目录列表
      const fileList = await client.list(remotePath)

      return fileList.map(file => {
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
  } catch (error) {
    console.error('获取 FTP 目录失败:', error)
    return {
      success: false,
      error: error.message || '获取目录失败'
    }
  }
})
