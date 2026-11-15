import { withFtpClient } from '~/server/utils/ftp.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { path: dirPath, name } = body

    if (!name || !name.trim()) {
      throw new Error('文件夹名称不能为空')
    }
    if (/[<>:"/\\|?*]/.test(name)) {
      throw new Error('文件夹名称包含非法字符')
    }

    const targetName = name.trim()
    const fullPath = dirPath && dirPath !== '.' ? `${dirPath}/${targetName}` : targetName

    // basic-ftp 的 ensureDir 会创建目录并将其切换为当前工作目录；
    // withFtpClient 归还连接前会统一 cd 回基础路径，不会污染后续请求
    await withFtpClient(async (client) => {
      await client.ensureDir(fullPath)
    })

    return {
      success: true,
      message: '文件夹创建成功',
      path: fullPath
    }
  } catch (error) {
    console.error('创建文件夹失败:', error)
    return {
      success: false,
      error: error.message || '创建文件夹失败'
    }
  }
})
