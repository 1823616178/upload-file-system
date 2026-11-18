import path from 'path'
import { createError, readBody } from 'h3'
import { mkdirFtp } from '~/server/utils/ftp-operations.js'
import { validateEntryName } from '~/server/utils/file-info.js'
import { resolveSafeFtpPath, withFtpClient, getFullRemotePath, invalidateFtpListCache } from '~/server/utils/ftp.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 支持 { dir, name } 或 { path: "a/b/c" }
    if (body?.name) {
      const result = await mkdirFtp({
        dirPath: body.dir || body.path || '.',
        name: body.name
      })
      return apiOk(event, result, '目录创建成功', 201)
    }

    if (!body?.path) {
      throw createError({ statusCode: 400, message: '缺少目录路径参数 path 或 name' })
    }

    const safeFull = resolveSafeFtpPath(body.path, { allowRoot: false })
    for (const seg of safeFull.split('/')) {
      validateEntryName(seg)
    }

    await withFtpClient(async (client) => {
      await client.ensureDir(safeFull)
    })
    invalidateFtpListCache()

    return apiOk(event, {
      path: path.posix.normalize(safeFull),
      remotePath: getFullRemotePath(safeFull)
    }, '目录创建成功', 201)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
