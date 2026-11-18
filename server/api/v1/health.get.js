import { getQuery } from 'h3'
import { getDataSource } from '~/server/utils/db.js'
import { withFtpClient } from '~/server/utils/ftp.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const deep = query.deep === 'true'

    const data = {
      status: 'ok',
      service: 'hanvon-upload-file-server',
      version: 'v1',
      client: event.context.apiClient?.name || 'unknown'
    }

    if (deep) {
      const checks = { database: 'unknown', ftp: 'unknown' }

      try {
        const ds = await getDataSource()
        await ds.query('SELECT 1')
        checks.database = 'ok'
      } catch (err) {
        checks.database = `error: ${err.message}`
      }

      try {
        await withFtpClient(async (client) => {
          await client.pwd()
        })
        checks.ftp = 'ok'
      } catch (err) {
        checks.ftp = `error: ${err.message}`
      }

      data.checks = checks
      data.status = checks.database === 'ok' && checks.ftp === 'ok' ? 'ok' : 'degraded'
    }

    return apiOk(event, data)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
