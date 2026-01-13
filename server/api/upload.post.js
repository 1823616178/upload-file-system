import { Client } from 'basic-ftp'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

// 历史记录存储文件路径
const HISTORY_FILE = path.join(process.cwd(), 'upload-history.json')

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

// 读取历史记录
const readHistory = () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('读取历史记录失败:', error)
    return []
  }
}

// 保存历史记录
const saveHistory = (record) => {
  try {
    const history = readHistory()
    history.unshift(record) // 添加到开头
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 验证文件类型
const validateFileType = (filename, type) => {
  const ext = path.extname(filename).toLowerCase()
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext)
  const isValidMimeType = ALLOWED_IMAGE_TYPES.includes(type?.toLowerCase())
  return isValidExtension || isValidMimeType
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

    const remotePathStr = remotePath?.data?.toString() || '/static/wenjinyangyi'

    const client = new Client()

    try {
      await client.access({
        host: '192.168.1.166',
        user: 'userftp',
        password: '550312171',
        port: 21,
        secure: false
      })

      // 确保远程目录存在
      await client.ensureDir(remotePathStr)

      // 上传文件 - 使用 Readable 流
      const remoteFilePath = `${remotePathStr}/${fileName}`

      // 将 Buffer 转换为可读流
      const buffer = Buffer.from(file.data)
      const stream = Readable.from(buffer)

      await client.uploadFrom(stream, remoteFilePath)

      console.log(`文件上传成功: ${remoteFilePath}`)

      // 保存到历史记录
      const historyRecord = {
        id: Date.now(),
        fileName: fileName,
        fileSize: fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        remotePath: remoteFilePath,
        uploadTime: new Date().toISOString(),
        fileType: file.type || getMimeType(fileName)
      }
      saveHistory(historyRecord)

      return {
        success: true,
        message: '文件上传成功',
        fileName: fileName,
        remotePath: remoteFilePath,
        fileSize: fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        recordId: historyRecord.id
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
