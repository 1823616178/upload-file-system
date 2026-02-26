import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { oldPath, newName } = body

    if (!oldPath) {
      throw new Error('缺少原文件路径参数')
    }

    if (!newName || !newName.trim()) {
      throw new Error('新文件名不能为空')
    }

    // 检查文件名是否合法
    if (/[<>:"/\\|?*]/.test(newName)) {
      throw new Error('文件名包含非法字符')
    }

    const client = await createFtpClient()

    try {
      // 获取目录路径
      const dirPath = path.dirname(oldPath)
      const newPath = dirPath === '.' ? newName.trim() : `${dirPath}/${newName.trim()}`

      console.log(`FTP 重命名: ${oldPath} -> ${newPath}`)

      // 执行重命名
      await client.rename(oldPath, newPath)

      return {
        success: true,
        newPath,
        message: '重命名成功'
      }
    } catch (ftpError) {
      console.error('FTP 重命名失败:', ftpError)
      throw new Error(`重命名失败: ${ftpError.message}`)
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('重命名操作失败:', error)
    return {
      success: false,
      error: error.message || '重命名失败'
    }
  }
})
