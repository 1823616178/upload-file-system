import { createError, getQuery, readBody } from 'h3'
import { deleteFtpEntry } from '~/server/utils/ftp-operations.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const body = await readBody(event).catch(() => null)

    const targetPath = body?.path || query.path
    const isDirectory = body?.isDirectory !== undefined
      ? Boolean(body.isDirectory)
      : query.isDirectory === 'true'

    if (!targetPath) {
      throw createError({ statusCode: 400, message: '缺少路径参数 path' })
    }

    const result = await deleteFtpEntry({
      targetPath,
      isDirectory,
      ignoreNotFound: false
    })

    return apiOk(event, result, isDirectory ? '目录删除成功' : '文件删除成功')
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
