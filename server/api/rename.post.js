import { readBody } from 'h3'
import { renameFtpEntry } from '~/server/utils/ftp-operations.js'

// 历史记录页的重命名：统一走 FTP 重命名（保留原扩展名、自动去重），同步更新数据库记录
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { newName, remotePath } = body || {}

    if (!remotePath) {
      throw new Error('缺少文件路径参数')
    }

    const result = await renameFtpEntry({
      oldPath: remotePath,
      newName,
      preserveExtension: true,
      autoDeduplicate: true
    })

    return {
      success: true,
      newName: result.newName,
      newRemotePath: result.newRemotePath
    }
  } catch (error) {
    console.error('FTP重命名错误详情:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '重命名失败'
    }
  }
})
