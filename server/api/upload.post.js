import { Readable } from 'stream'
import path from 'path'
import { getUploadHistoryRepository } from '~/server/utils/db.js'

// 允许的文件 MIME 类型
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/json',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/font-sfnt',
  'application/x-font-ttf',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'font/woff',
  'application/font-woff2',
  'font/woff2'
]

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.xml', '.json', '.zip', '.rar', '.7z',
  '.ttf', '.otf', '.woff', '.woff2'
]

// 最大文件大小 100MB (100 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// 验证文件类型
const validateFileType = (filename, type) => {
  const ext = path.extname(filename).toLowerCase()
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext)
  const isValidMimeType = ALLOWED_FILE_TYPES.includes(type?.toLowerCase())
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
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
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
    const targetDirField = formData.find(item => item.name === 'targetDir')
    // targetDir 用于 ftp-manager 上传到当前浏览目录的场景；不传则按原有逻辑上传到 FTP 根目录并记录历史
    const targetDir = targetDirField?.data ? targetDirField.data.toString().trim() : ''

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
      throw new Error('文件格式不支持，支持的格式：jpg, png, gif, webp, bmp, svg, pdf, doc/docx, xls/xlsx, ppt/pptx, txt, xml, json, zip, rar, 7z, ttf, otf, woff, woff2')
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
        const fileList = await client.list(targetDir || undefined)
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

      // targetDir 为空时上传到 FTP 根目录（原有 /uploadFile 流程）；
      // 否则上传到 ftp-manager 当前浏览的目录
      const uploadDestination = targetDir ? `${targetDir}/${actualFileName}` : actualFileName

      // 将 Buffer 转换为可读流
      const buffer = Buffer.from(file.data)
      const stream = Readable.from(buffer)

      await client.uploadFrom(stream, uploadDestination)

      // 完整路径用于数据库存储和返回
      const remoteFilePath = targetDir
        ? `${ftpBasePath}${targetDir.startsWith('/') ? '' : '/'}${targetDir}/${actualFileName}`
        : `${ftpBasePath}/${actualFileName}`
      console.log(`文件上传成功: ${remoteFilePath}`)

      // 通过 ftp-manager 上传到子目录的文件不计入"上传历史"（该功能仅针对根目录的curated 上传流程）
      if (targetDir) {
        return {
          success: true,
          message: '文件上传成功',
          fileName: actualFileName,
          remotePath: remoteFilePath,
          fileSize: fileSize,
          fileSizeFormatted: formatFileSize(fileSize)
        }
      }

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
