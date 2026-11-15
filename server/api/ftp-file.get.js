import { Writable } from 'stream'
import { withFtpClient } from '~/server/utils/ftp.js'
import { formatFileSize, getExtension } from '~/server/utils/file-info.js'

// 读取小体积文本类文件（XML/JSON/TXT）返回 base64 内容，供前端预览。
// 图片/PDF 预览请走 /api/ftp-image（直接返回二进制，避免 base64 膨胀 33%）。
const TEXT_PREVIEW_EXTENSIONS = ['.xml', '.json', '.txt']

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.path

    if (!remotePath) {
      throw new Error('缺少文件路径参数')
    }

    const ext = getExtension(remotePath)
    if (!TEXT_PREVIEW_EXTENSIONS.includes(ext)) {
      throw new Error('该接口仅支持文本类文件预览（xml/json/txt）')
    }

    const result = await withFtpClient(async (client) => {
      const fileName = remotePath.includes('/')
        ? remotePath.substring(remotePath.lastIndexOf('/') + 1)
        : remotePath

      // 使用 Writable 流收集数据
      const chunks = []
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await client.downloadTo(writableStream, remotePath)
      const buffer = Buffer.concat(chunks)
      const base64 = buffer.toString('base64')

      return {
        path: remotePath,
        name: fileName,
        size: buffer.length,
        base64
      }
    })

    return {
      success: true,
      isDirectory: false,
      data: {
        ...result,
        sizeFormatted: formatFileSize(result.size),
        type: getMimeTypeForText(ext),
        previewUrl: `data:${getMimeTypeForText(ext)};base64,${result.base64}`
      }
    }
  } catch (error) {
    console.error('获取 FTP 文件失败:', error)
    return {
      success: false,
      error: error.message || '获取文件失败'
    }
  }
})

function getMimeTypeForText(ext) {
  if (ext === '.json') return 'application/json'
  if (ext === '.txt') return 'text/plain'
  return 'application/xml'
}
