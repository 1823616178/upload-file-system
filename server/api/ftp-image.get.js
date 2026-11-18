import { createError, getQuery } from 'h3'
import { resolveSafeFtpPath, streamFtpFile } from '~/server/utils/ftp.js'
import { getExtension, getMimeType } from '~/server/utils/file-info.js'

// 流式返回 FTP 文件的二进制内容（图片 / PDF 预览），支持相对 ftpBasePath 的子目录路径
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = query.path || query.name

  if (!rawPath) {
    throw createError({
      statusCode: 400,
      message: '需要文件名参数 (path 或 name)'
    })
  }

  const safePath = resolveSafeFtpPath(rawPath, { allowRoot: false })
  const mimeType = getMimeType(safePath)
  const extraHeaders = {
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff'
  }

  // 防止 SVG 内嵌脚本在同源下执行
  if (getExtension(safePath) === '.svg') {
    extraHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
  }

  await streamFtpFile(event, safePath, {
    contentType: mimeType,
    extraHeaders
  })
})
