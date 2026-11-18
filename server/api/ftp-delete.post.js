import { readBody } from 'h3'
import { deleteFtpEntry } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { path, isDirectory } = body || {}

    if (!path) {
      throw new Error('缺少文件路径参数')
    }

    await deleteFtpEntry({
      targetPath: path,
      isDirectory: Boolean(isDirectory),
      ignoreNotFound: false
    })

    return {
      success: true,
      message: isDirectory ? '目录删除成功' : '文件删除成功'
    }
  } catch (error) {
    console.error('删除操作失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '删除失败'
    }
  }
})
