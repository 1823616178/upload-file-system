import { getRequestHeader, getRequestIP, readMultipartFormData } from 'h3'
import { uploadFtpFile } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw new Error('没有接收到文件数据')
    }

    const file = formData.find(item => item.name === 'file')
    const targetDirField = formData.find(item => item.name === 'targetDir')
    // targetDir 用于 ftp-manager 上传到当前浏览目录的场景；不传则上传到 FTP 根目录并记录历史
    const targetDir = targetDirField?.data ? targetDirField.data.toString().trim() : ''

    if (!file || !file.data) {
      throw new Error('未找到上传的文件')
    }

    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'

    const result = await uploadFtpFile({
      fileBuffer: file.data,
      originalFilename: file.filename || 'uploaded_file',
      mimeType: file.type,
      targetDir: targetDir || '.',
      keepOriginalName: false,
      overwrite: false,
      recordHistory: !targetDir,
      ipAddress,
      userAgent
    })

    if (targetDir) {
      return {
        success: true,
        message: '文件上传成功',
        fileName: result.fileName,
        remotePath: result.remotePath,
        fileSize: result.fileSize,
        fileSizeFormatted: result.fileSizeFormatted
      }
    }

    return {
      success: true,
      message: '文件上传成功',
      fileName: result.fileName,
      remotePath: result.remotePath,
      fileSize: result.fileSize,
      fileSizeFormatted: result.fileSizeFormatted,
      recordId: result.recordId,
      uploadTime: result.uploadTime
    }
  } catch (error) {
    console.error('服务器错误:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '服务器处理失败'
    }
  }
})
