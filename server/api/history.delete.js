import { Client } from 'basic-ftp'
import prisma from '~/server/utils/db.js'

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

      const client = new Client()
      try {
        await client.access({
          host: '192.168.1.166',
          user: 'userftp',
          password: '550312171',
          port: 21,
          secure: false
        })

        // 删除远程文件
        await client.remove(remotePath)
        console.log(`FTP 文件删除成功: ${remotePath}`)

        // 同时尝试清理数据库中对应的记录（如果存在）
        try {
          await prisma.uploadHistory.deleteMany({
            where: {
              remotePath: remotePath
            }
          })
          console.log('关联的数据库记录已清理')
        } catch (dbError) {
          console.warn('清理数据库记录失败 (非致命):', dbError)
        }

        return {
          success: true,
          message: '文件已删除'
        }
      } catch (ftpError) {
        console.error('FTP 操作失败:', ftpError)
        throw new Error(`无法删除 FTP 文件: ${ftpError.message}`)
      } finally {
        client.close()
      }
    }

    // 数据库来源删除逻辑
    if (!id) {
      throw new Error('缺少记录 ID')
    }

    const idNumber = Math.floor(Number(id))
    const idBigInt = BigInt(idNumber)

    console.log(`删除数据库记录 ID: ${idBigInt}`)

    // 从数据库删除记录
    await prisma.uploadHistory.delete({
      where: {
        id: idBigInt
      }
    })

    return {
      success: true,
      message: '记录删除成功'
    }

  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        error: '找不到该记录'
      }
    }

    console.error('删除处理失败:', error)
    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
})