import { getQuery } from 'h3'
import { listFtpDirectory } from '~/server/utils/ftp-operations.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const result = await listFtpDirectory({
      dirPath: query.dir || query.path || '.',
      type: query.type || 'all',
      search: String(query.search || '').trim(),
      page: query.page || 1,
      pageSize: query.pageSize || 50
    })

    return apiOk(event, result)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
