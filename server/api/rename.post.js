import path from 'path'
import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { withFtpClient } from '~/server/utils/ftp.js'

// 历史记录页的重命名：统一走 FTP 重命名（所有文件都在 FTP 根目录下），
// 行为与 ftp-manager 的 /api/ftp-rename 保持一致——不加时间戳，重名时追加序号
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { oldName, newName, remotePath } = body

    if (!newName || !newName.trim()) {
      throw new Error('新文件名不能为空')
    }
    if (!remotePath) {
      throw new Error('缺少文件路径参数')
    }

    // 检查文件名是否合法
    if (/[<>:"/\\|?*]/.test(newName)) {
      throw new Error('文件名包含非法字符')
    }

    // 保持原有扩展名
    const oldExt = path.extname(oldName || remotePath)
    const finalNewName = `${newName.trim()}${oldExt}`

    const { actualNewName, newRemotePath } = await withFtpClient(async (client) => {
      // 一次 list 同时完成：旧文件存在性检查 + 新文件名冲突检查
      const fileList = await client.list()
      const existingNames = fileList.map(f => f.name)

      const oldFileName = remotePath.split('/').pop()
      if (!existingNames.includes(oldFileName)) {
        throw new Error(`原文件 ${oldFileName} 不存在`)
      }

      // 如果新文件名已存在，追加序号
      let candidate = finalNewName
      let counter = 1
      while (existingNames.includes(candidate)) {
        const nameWithoutExt = path.basename(finalNewName, oldExt)
        candidate = `${nameWithoutExt}(${counter})${oldExt}`
        counter++
      }
      if (candidate !== finalNewName) {
        console.log(`重命名冲突，重命名为: ${candidate}`)
      }

      const newRemotePath = `${remotePath.substring(0, remotePath.lastIndexOf('/'))}/${candidate}`
      console.log(`FTP重命名: ${oldFileName} -> ${candidate}`)

      await client.rename(oldFileName, candidate)
      return { actualNewName: candidate, newRemotePath }
    })

    // 更新数据库记录（如果存在）
    try {
      const uploadHistoryRepository = await getUploadHistoryRepository()
      await uploadHistoryRepository.update(
        { remotePath: remotePath },
        {
          fileName: actualNewName,
          remotePath: newRemotePath
        }
      )
    } catch (e) {
      console.warn('关联数据库更新失败', e)
    }

    return { success: true, newName: actualNewName, newRemotePath }
  } catch (error) {
    console.error('FTP重命名错误详情:', error)
    return { success: false, error: error.message || '重命名失败' }
  }
})
