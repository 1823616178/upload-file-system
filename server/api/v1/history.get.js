import { getQuery } from 'h3'
import { queryUploadHistory } from '~/server/utils/ftp-operations.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const result = await queryUploadHistory({
      page: query.page,
      pageSize: query.pageSize || 20,
      search: query.search || '',
      fileCategory: query.category || query.fileCategory || 'all',
      sourceFilter: query.source || 'all',
      startDate: query.startDate || '',
      endDate: query.endDate || ''
    })

    return apiOk(event, {
      items: result.data,
      source: result.source,
      pagination: result.pagination
    })
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
