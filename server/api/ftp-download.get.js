import { Writable } from 'stream'
import { withFtpClient } from '~/server/utils/ftp.js'
import { getMimeType } from '~/server/utils/file-info.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const remotePath = query.path

  if (!remotePath) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少文件路径参数',
      message: '缺少文件路径参数',
    })
  }

  const fileName = remotePath.split('/').pop()
  const buffer = await withFtpClient(async (client) => {
    const chunks = []
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    await client.downloadTo(writable, remotePath)
    return Buffer.concat(chunks)
  })

  setHeader(event, 'Content-Type', getMimeType(fileName))
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
  setHeader(event, 'Content-Length', buffer.length)

  return buffer
})
