import { readBody } from 'h3'
import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { deleteFtpEntry } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, source, remotePath } = body || {}

    if (source === 'ftp') {
      if (!remotePath) {
        throw new Error('FTP 删除需要文件路径')
      }

      await deleteFtpEntry({
        targetPath: remotePath,
        isDirectory: false,
        ignoreNotFound: false
      })

      return {
        success: true,
        message: '文件已删除'
      }
    }

    const idStr = String(id ?? '').trim()
    if (!/^\d+$/.test(idStr)) {
      throw new Error('缺少或非法的记录 ID')
    }

    const idBigInt = BigInt(idStr)
    const uploadHistoryRepository = await getUploadHistoryRepository()
    const record = await uploadHistoryRepository.findOneBy({ id: idBigInt })
    const targetRemotePath = record?.remotePath || remotePath

    // 同步删除 FTP 上的物理文件（若已不存在则忽略 404，保证可清理孤立数据库记录）
    if (targetRemotePath) {
      await deleteFtpEntry({
        targetPath: targetRemotePath,
        isDirectory: false,
        ignoreNotFound: true
      })
    }

    await uploadHistoryRepository.delete(idBigInt)

    return {
      success: true,
      message: '记录与关联文件删除成功'
    }
  } catch (error) {
    console.error('删除处理失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '删除失败'
    }
  }
})
