import { Readable } from 'stream'
import path from 'path'
import { getUploadHistoryRepository } from '~/server/utils/db.js'

// 允许的图片格式
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
]

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

// 最大文件大小 100MB (100 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// 验证文件类型
const validateFileType = (filename, type) => {
  const ext = path.extname(filename).toLowerCase()
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext)
  const isValidMimeType = ALLOWED_IMAGE_TYPES.includes(type?.toLowerCase())
  return isValidExtension || isValidMimeType
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 根据文件名获取 MIME 类型
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw new Error('没有接收到文件数据')
    }

    const file = formData.find(item => item.name === 'file')
    const remotePath = formData.find(item => item.name === 'remotePath')

    if (!file || !file.data) {
      throw new Error('未找到上传的文件')
    }

    const fileName = file.filename || 'uploaded_file'
    const fileSize = file.data ? file.data.length : 0

    // 验证文件大小
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // 验证文件类型
    if (!validateFileType(fileName, file.type)) {
      throw new Error('文件格式不支持，仅支持图片格式：jpg, png, gif, webp, bmp, svg')
    }

    // 生成带时间戳的新文件名
    const ext = path.extname(fileName)
    const name = path.basename(fileName, ext)
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    
    const finalFileName = `${name}_${timestamp}${ext}`

    const config = useRuntimeConfig()
    const ftpBasePath = config.ftpBasePath || '/static/zhonghuaguji/wenjinyangji'

    const client = await createFtpClient()

    try {
      // 检查文件是否已存在，如果存在则添加序号
      let actualFileName = finalFileName
      let counter = 1
      
      try {
        const fileList = await client.list()
        const existingFiles = fileList.map(f => f.name)
        
        // 如果文件已存在，添加序号
        while (existingFiles.includes(actualFileName)) {
          const nameWithoutExt = path.basename(finalFileName, ext)
          actualFileName = `${nameWithoutExt}(${counter})${ext}`
          counter++
        }
        
        if (counter > 1) {
          console.log(`文件重名，重命名为: ${actualFileName}`)
        }
      } catch (listError) {
        console.warn('无法获取FTP文件列表:', listError.message)
        // 如果无法获取文件列表，继续使用原文件名
      }
      
      // FTP 客户端已经在 ftp.js 中切换到根目录，直接使用文件名
      // 将 Buffer 转换为可读流
      const buffer = Buffer.from(file.data)
      const stream = Readable.from(buffer)

      await client.uploadFrom(stream, actualFileName)

      // 完整路径用于数据库存储和返回
      const remoteFilePath = `${ftpBasePath}/${actualFileName}`
      console.log(`文件上传成功: ${remoteFilePath}`)

      // 获取客户端信息
      const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
      const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

      // 保存到数据库 - 使用 TypeORM
      const uploadHistoryRepository = await getUploadHistoryRepository()
      const record = await uploadHistoryRepository.save({
        fileName: actualFileName,
        fileSize: fileSize.toString(),
        fileType: file.type || getMimeType(actualFileName),
        remotePath: remoteFilePath,
        uploadTime: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent
      })

      console.log(`历史记录保存成功，ID: ${record.id}`)

      return {
        success: true,
        message: '文件上传成功',
        fileName: actualFileName,
        remotePath: remoteFilePath,
        fileSize: fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        recordId: record.id.toString(),
        uploadTime: record.uploadTime.toISOString()
      }
    } catch (ftpError) {
      console.error('FTP上传失败:', ftpError)
      throw new Error(`FTP上传失败: ${ftpError.message}`)
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('服务器错误:', error)
    return {
      success: false,
      error: error.message || '服务器处理失败'
    }
  }
})
