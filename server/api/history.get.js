import { getQuery } from 'h3'
import { queryUploadHistory } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const queryStr = getQuery(event)
    const result = await queryUploadHistory({
      page: queryStr.page,
      pageSize: queryStr.pageSize,
      search: queryStr.search || '',
      fileCategory: queryStr.fileCategory || 'all',
      sourceFilter: queryStr.source || 'all',
      startDate: queryStr.startDate || '',
      endDate: queryStr.endDate || ''
    })

    return {
      success: true,
      ...result
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '获取历史记录失败'
    }
  }
})
