import { readBody } from 'h3'
import { renameFtpEntry } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { oldPath, newName } = body || {}

    if (!oldPath) {
      throw new Error('缺少原文件路径参数')
    }

    const result = await renameFtpEntry({
      oldPath,
      newName,
      preserveExtension: false,
      autoDeduplicate: false
    })

    return {
      success: true,
      newPath: result.newPath,
      message: '重命名成功'
    }
  } catch (error) {
    console.error('重命名操作失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '重命名失败'
    }
  }
})
