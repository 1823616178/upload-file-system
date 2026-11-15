import { Readable } from 'stream'
import path from 'path'
import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { withFtpClient } from '~/server/utils/ftp.js'
import { isAllowedUploadFile, getMimeType, formatFileSize, formatTimestamp } from '~/server/utils/file-info.js'

// 最大文件大小 100MB (100 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = 100 * 1024 * 1024

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
    if (!isAllowedUploadFile(fileName, file.type)) {
      throw new Error('文件格式不支持，支持的格式：jpg, png, gif, webp, bmp, svg, pdf, doc/docx, xls/xlsx, ppt/pptx, txt, xml, json, zip, rar, 7z, ttf, otf, woff, woff2')
    }

    // 生成带时间戳的新文件名
    const ext = path.extname(fileName)
    const name = path.basename(fileName, ext)
    const finalFileName = `${name}_${formatTimestamp()}${ext}`

    const config = useRuntimeConfig()
    const ftpBasePath = config.ftpBasePath || '/static/zhonghuaguji/wenjinyangji'

    // targetDir 为空时上传到 FTP 根目录（原有 /uploadFile 流程）；
    // 否则上传到 ftp-manager 当前浏览的目录
    const uploadDestination = await withFtpClient(async (client) => {
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

      const destination = targetDir ? `${targetDir}/${actualFileName}` : actualFileName

      // 将 Buffer 转换为可读流
      const buffer = Buffer.from(file.data)
      const stream = Readable.from(buffer)

      await client.uploadFrom(stream, destination)

      return destination
    })

    const actualFileName = path.basename(uploadDestination)
    console.log(`文件上传成功: ${ftpBasePath}/${uploadDestination}`)

    // 完整路径用于数据库存储和返回
    const remoteFilePath = `${ftpBasePath}/${uploadDestination}`.replace(/\/{2,}/g, '/')

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
  } catch (error) {
    console.error('服务器错误:', error)
    return {
      success: false,
      error: error.message || '服务器处理失败'
    }
  }
})
