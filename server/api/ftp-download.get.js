import path from 'path'
import { createError, getQuery } from 'h3'
import { resolveSafeFtpPath, streamFtpFile } from '~/server/utils/ftp.js'
import { getExtension, getMimeType } from '~/server/utils/file-info.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = query.path

  if (!rawPath) {
    throw createError({
      statusCode: 400,
      message: '缺少文件路径参数'
    })
  }

  const safePath = resolveSafeFtpPath(rawPath, { allowRoot: false })
  const fileName = path.posix.basename(safePath)
  const mimeType = getMimeType(fileName)
  const isInline = query.inline === 'true'
  const extraHeaders = {
    'X-Content-Type-Options': 'nosniff'
  }
  if (isInline && getExtension(fileName) === '.svg') {
    extraHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
  }

  await streamFtpFile(event, safePath, {
    contentType: mimeType,
    disposition: isInline ? 'inline' : 'attachment',
    filename: fileName,
    extraHeaders
  })
})
