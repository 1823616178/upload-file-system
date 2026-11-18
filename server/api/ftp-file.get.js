import path from 'path'
import { Writable } from 'stream'
import { createError, getQuery } from 'h3'
import { withFtpClient, resolveSafeFtpPath, isFtpNotFoundError } from '~/server/utils/ftp.js'
import { formatFileSize, getExtension, getMimeType, TEXT_PREVIEW_EXTENSIONS } from '~/server/utils/file-info.js'

const MAX_TEXT_PREVIEW_BYTES = 5 * 1024 * 1024 // 5MB

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawPath = query.path

    if (!rawPath) {
      throw new Error('缺少文件路径参数')
    }

    const safePath = resolveSafeFtpPath(rawPath, { allowRoot: false })
    const ext = getExtension(safePath)
    if (!TEXT_PREVIEW_EXTENSIONS.includes(ext)) {
      throw new Error('该接口仅支持文本类文件预览（xml/json/txt）')
    }

    const result = await withFtpClient(async (client) => {
      try {
        const size = await client.size(safePath)
        if (size > MAX_TEXT_PREVIEW_BYTES) {
          throw createError({
            statusCode: 413,
            message: '文件超过 5MB，请下载后查看'
          })
        }
      } catch (sizeErr) {
        if (sizeErr?.statusCode === 413) throw sizeErr
      }

      const fileName = path.posix.basename(safePath)
      const chunks = []
      let totalBytes = 0

      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          totalBytes += chunk.length
          if (totalBytes > MAX_TEXT_PREVIEW_BYTES) {
            callback(createError({
              statusCode: 413,
              message: '文件超过 5MB，请下载后查看'
            }))
            return
          }
          chunks.push(Buffer.from(chunk))
          callback()
        }
      })

      try {
        await client.downloadTo(writableStream, safePath)
      } catch (err) {
        if (isFtpNotFoundError(err)) {
          throw new Error('文件不存在')
        }
        throw err
      }

      const buffer = Buffer.concat(chunks)
      const base64 = buffer.toString('base64')

      return {
        path: safePath,
        name: fileName,
        size: buffer.length,
        base64
      }
    })

    const mimeType = getMimeType(result.name)
    return {
      success: true,
      isDirectory: false,
      data: {
        ...result,
        sizeFormatted: formatFileSize(result.size),
        type: mimeType,
        previewUrl: `data:${mimeType};base64,${result.base64}`
      }
    }
  } catch (error) {
    console.error('获取 FTP 文件失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '获取文件失败'
    }
  }
})
