import { createError, getQuery } from 'h3'
import { serveFtpThumbnail } from '~/server/utils/ftp-operations.js'
import { handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawPath = query.path
    if (!rawPath) {
      throw createError({ statusCode: 400, message: '缺少 path 参数' })
    }
    return await serveFtpThumbnail(event, rawPath, query.size)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
