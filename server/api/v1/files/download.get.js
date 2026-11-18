import path from 'path'
import { createError, getQuery } from 'h3'
import { resolveSafeFtpPath, streamFtpFile } from '~/server/utils/ftp.js'
import { getExtension, getMimeType } from '~/server/utils/file-info.js'
import { handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawPath = query.path

    if (!rawPath) {
      throw createError({ statusCode: 400, message: '缺少 path 参数' })
    }

    const safePath = resolveSafeFtpPath(rawPath, { allowRoot: false })
    const fileName = path.posix.basename(safePath)
    const isInline = query.inline === 'true'
    const extraHeaders = {
      'X-Content-Type-Options': 'nosniff'
    }
    if (isInline && getExtension(fileName) === '.svg') {
      extraHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    }

    await streamFtpFile(event, safePath, {
      contentType: getMimeType(fileName),
      disposition: isInline ? 'inline' : 'attachment',
      filename: fileName,
      extraHeaders
    })
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
