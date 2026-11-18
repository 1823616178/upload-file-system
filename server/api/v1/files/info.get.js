import { createError, getQuery } from 'h3'
import { getFtpEntryInfo } from '~/server/utils/ftp-operations.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const targetPath = query.path
    if (!targetPath) {
      throw createError({ statusCode: 400, message: '缺少 path 参数' })
    }

    const info = await getFtpEntryInfo(targetPath)
    return apiOk(event, info)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
