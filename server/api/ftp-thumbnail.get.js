import { createError, getQuery } from 'h3'
import { serveFtpThumbnail } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = query.path || query.name

  if (!rawPath) {
    throw createError({
      statusCode: 400,
      message: '需要文件名参数 (path 或 name)'
    })
  }

  return await serveFtpThumbnail(event, rawPath, query.size)
})
