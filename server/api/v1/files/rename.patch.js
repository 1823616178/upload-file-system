import { createError, readBody } from 'h3'
import { renameFtpEntry } from '~/server/utils/ftp-operations.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const oldPath = body?.path || body?.oldPath
    const newName = body?.newName
    const preserveExtension = Boolean(body?.preserveExtension)
    const autoDeduplicate = Boolean(body?.autoDeduplicate)

    if (!oldPath) {
      throw createError({ statusCode: 400, message: '缺少原路径参数 path' })
    }

    const result = await renameFtpEntry({
      oldPath,
      newName,
      preserveExtension,
      autoDeduplicate
    })

    return apiOk(event, result, '重命名成功')
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
