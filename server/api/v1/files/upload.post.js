import { createError, getRequestHeader, getRequestIP, readMultipartFormData } from 'h3'
import { uploadFtpFile } from '~/server/utils/ftp-operations.js'
import { getExtension, IMAGE_EXTENSIONS } from '~/server/utils/file-info.js'
import { apiOk, handleOpenApiError } from '~/server/utils/api-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, message: '请求体必须为 multipart/form-data' })
    }

    const getField = (name) => {
      const item = formData.find(f => f.name === name && !f.filename)
      return item?.data ? item.data.toString('utf8').trim() : ''
    }

    const file = formData.find(item => item.name === 'file')
    if (!file || !file.data) {
      throw createError({ statusCode: 400, message: '缺少文件字段 file' })
    }

    const targetDir = getField('dir') || getField('targetDir') || '.'
    const customFilename = getField('filename')
    const keepOriginalName = getField('keepOriginalName') === 'true'
    const overwrite = getField('overwrite') === 'true'
    const recordHistory = getField('recordHistory') !== 'false'

    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
    const rawUa = getRequestHeader(event, 'user-agent') || 'OpenAPI'
    const clientLabel = event.context.apiClient?.name || 'external'

    const result = await uploadFtpFile({
      fileBuffer: file.data,
      originalFilename: file.filename || 'uploaded_file',
      mimeType: file.type,
      targetDir,
      customFilename,
      keepOriginalName,
      overwrite,
      recordHistory,
      ipAddress,
      userAgent: `api:${clientLabel} | ${rawUa}`
    })

    const encodedPath = encodeURIComponent(result.path)
    const ext = getExtension(result.fileName).replace('.', '')
    const links = {
      download: `/api/v1/files/download?path=${encodedPath}`,
      preview: `/api/v1/files/download?path=${encodedPath}&inline=true`,
      info: `/api/v1/files/info?path=${encodedPath}`
    }
    if (IMAGE_EXTENSIONS.includes(ext)) {
      links.thumbnail = `/api/v1/files/thumbnail?path=${encodedPath}&size=120`
    }

    return apiOk(event, { ...result, links }, '文件上传成功', 201)
  } catch (error) {
    return handleOpenApiError(event, error)
  }
})
