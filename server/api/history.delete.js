import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { withFtpClient } from '~/server/utils/ftp.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, source, remotePath } = body

    // 检查是否是 FTP 来源
    if (source === 'ftp') {
      if (!remotePath) {
        throw new Error('FTP 删除需要文件路径')
      }

      console.log(`正在删除 FTP 文件: ${remotePath}`)

      // FTP 文件都在基础路径下，remotePath 为 FTP 根开始的绝对路径
      await withFtpClient(async (client) => {
        await client.remove(remotePath)
      })

      // 同时尝试清理数据库中对应的记录（如果存在）
      try {
        const uploadHistoryRepository = await getUploadHistoryRepository()
        await uploadHistoryRepository.delete({
          remotePath: remotePath
        })
        console.log('关联的数据库记录已清理')
      } catch (dbError) {
        console.warn('清理数据库记录失败 (非致命):', dbError)
      }

      return {
        success: true,
        message: '文件已删除'
      }
    }

    // 数据库来源删除逻辑
    if (!id) {
      throw new Error('缺少记录 ID')
    }

    const idBigInt = BigInt(Math.floor(Number(id)))

    console.log(`删除数据库记录 ID: ${idBigInt}`)

    const uploadHistoryRepository = await getUploadHistoryRepository()
    await uploadHistoryRepository.delete(idBigInt)

    return {
      success: true,
      message: '记录删除成功'
    }
  } catch (error) {
    console.error('删除处理失败:', error)
    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
})
