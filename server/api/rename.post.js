import { getUploadHistoryRepository } from '~/server/utils/db.js'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, oldName, newName, source, remotePath } = body

    if (!newName || !newName.trim()) {
      throw new Error('新文件名不能为空')
    }

    // 检查文件名是否合法
    if (/[<>:"/\\|?*]/.test(newName)) {
      throw new Error('文件名包含非法字符')
    }
    
    // 保持原有扩展名
    const oldExt = path.extname(oldName)
    
    // 生成时间戳
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    
    // 新文件名 = 用户输入的名字_时间戳.扩展名
    let finalNewName = `${newName.trim()}_${timestamp}${oldExt}`

    // 统一走 FTP 重命名逻辑（因为所有文件都在 FTP 上）
    const client = await createFtpClient()
    try {
         // 检查新文件名是否已存在，如果存在则添加序号
         let actualNewName = finalNewName
         let counter = 1
         
         try {
           const fileList = await client.list()
           const existingFiles = fileList.map(f => f.name)
           
           // 如果文件已存在，添加序号
           while (existingFiles.includes(actualNewName)) {
             const nameWithoutExt = path.basename(finalNewName, oldExt)
             actualNewName = `${nameWithoutExt}(${counter})${oldExt}`
             counter++
           }
           
           if (counter > 1) {
             console.log(`重命名冲突，重命名为: ${actualNewName}`)
           }
         } catch (listError) {
           console.warn('无法获取FTP文件列表:', listError.message)
         }
         
         // 获取旧文件名（只有文件名，不包含路径）
         const oldFileName = remotePath.split('/').pop()
         const newRemotePath = `${remotePath.substring(0, remotePath.lastIndexOf('/'))}/${actualNewName}`
         
         console.log(`FTP重命名: ${oldFileName} -> ${actualNewName}`)
         
         // 检查旧文件是否存在
         try {
           const fileList = await client.list()
           const fileExists = fileList.some(f => f.name === oldFileName)
           if (!fileExists) {
             throw new Error(`原文件 ${oldFileName} 不存在`)
           }
         } catch (checkError) {
           console.error('检查文件存在性失败:', checkError.message)
         }
         
         // 执行重命名
         await client.rename(oldFileName, actualNewName)
         
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
       } catch (err) {
         console.error('FTP重命名错误详情:', err)
         throw new Error(`FTP重命名失败: ${err.message}`)
       } finally {
         client.close()
       }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
