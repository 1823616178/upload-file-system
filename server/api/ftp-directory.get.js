import { getQuery } from 'h3'
import { listFtpDirectory } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const data = await listFtpDirectory({
      dirPath: query.path || '.'
    })

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('获取 FTP 目录失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '获取目录失败'
    }
  }
})
