import path from 'path'
import { Readable, Writable } from 'stream'
import sharp from 'sharp'
import { createError, setHeader } from 'h3'
import { Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'
import { getUploadHistoryRepository } from './db.js'
import {
  withFtpClient,
  resolveSafeFtpPath,
  getFullRemotePath,
  getCachedFtpList,
  invalidateFtpListCache,
  isFtpNotFoundError
} from './ftp.js'
import {
  MAX_UPLOAD_SIZE,
  IMAGE_EXTENSIONS,
  isAllowedUploadFile,
  sanitizeFilename,
  validateEntryName,
  normalizeDbFileType,
  getExtension,
  getMimeType,
  formatFileSize,
  formatTimestamp,
  getFileCategory
} from './file-info.js'
import {
  getCachedThumbnail,
  setCachedThumbnail,
  invalidateThumbnailCache
} from './thumbnail-cache.js'

const parseDateBoundary = (dateStr, endOfDay = false) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const parsed = new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const uploadFtpFile = async ({
  fileBuffer,
  originalFilename,
  mimeType,
  targetDir = '.',
  customFilename = '',
  keepOriginalName = false,
  overwrite = false,
  recordHistory = true,
  ipAddress = '0.0.0.0',
  userAgent = 'Unknown'
}) => {
  if (!fileBuffer || fileBuffer.length === undefined) {
    throw createError({ statusCode: 400, message: '未找到上传的文件' })
  }

  const fileSize = fileBuffer.length
  if (fileSize > MAX_UPLOAD_SIZE) {
    throw createError({
      statusCode: 413,
      message: `文件大小超过限制，最大允许 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`
    })
  }

  const rawName = sanitizeFilename(customFilename || originalFilename)
  if (!isAllowedUploadFile(rawName, mimeType)) {
    throw createError({
      statusCode: 415,
      message: '文件格式不支持，支持的格式：jpg, png, gif, webp, bmp, svg, pdf, doc/docx, xls/xlsx, ppt/pptx, txt, xml, json, zip, rar, 7z, ttf, otf, woff, woff2'
    })
  }

  const safeDir = resolveSafeFtpPath(targetDir || '.', { allowRoot: true })
  const ext = path.posix.extname(rawName)
  const baseName = path.posix.basename(rawName, ext)
  const preferredFileName = keepOriginalName
    ? `${baseName}${ext}`
    : `${baseName}_${formatTimestamp()}${ext}`

  const actualFileName = await withFtpClient(async (client) => {
    if (safeDir !== '.') {
      await client.ensureDir(safeDir)
    }

    let candidateName = preferredFileName
    if (!overwrite) {
      try {
        const fileList = await client.list('.')
        const existingFiles = new Set(fileList.map(f => f.name))
        let counter = 1
        while (existingFiles.has(candidateName)) {
          candidateName = `${path.posix.basename(preferredFileName, ext)}(${counter})${ext}`
          counter++
        }
      } catch (listError) {
        console.warn('无法获取FTP文件列表:', listError.message)
      }
    }

    const stream = Readable.from(fileBuffer)
    await client.uploadFrom(stream, candidateName)
    return candidateName
  })

  const relativePath = safeDir === '.' ? actualFileName : `${safeDir}/${actualFileName}`
  const remoteFilePath = getFullRemotePath(relativePath)
  const resolvedMime = mimeType || getMimeType(actualFileName)

  invalidateFtpListCache()
  invalidateThumbnailCache(relativePath)

  let record = null
  if (recordHistory) {
    const uploadHistoryRepository = await getUploadHistoryRepository()
    record = await uploadHistoryRepository.save({
      fileName: actualFileName,
      fileSize: fileSize.toString(),
      fileType: normalizeDbFileType(resolvedMime),
      remotePath: remoteFilePath,
      uploadTime: new Date(),
      ipAddress,
      userAgent: String(userAgent || 'Unknown').slice(0, 500)
    })
  }

  return {
    fileName: actualFileName,
    path: relativePath,
    remotePath: remoteFilePath,
    fileSize,
    fileSizeFormatted: formatFileSize(fileSize),
    mimeType: resolvedMime,
    recordId: record ? record.id.toString() : null,
    uploadTime: (record ? record.uploadTime : new Date()).toISOString()
  }
}

export const listFtpDirectory = async ({
  dirPath = '.',
  type = 'all',
  search = '',
  page = null,
  pageSize = null
} = {}) => {
  const safeDir = resolveSafeFtpPath(dirPath || '.', { allowRoot: true })

  const entries = await withFtpClient(async (client) => {
    const fileList = await client.list(safeDir)
    return fileList
      .filter(file => file.name !== '.' && file.name !== '..')
      .map(file => {
        const isDir = file.isDirectory === true || file.type === 2
        const fullPath = safeDir === '.' ? file.name : `${safeDir}/${file.name}`
        return {
          name: file.name,
          size: file.size || 0,
          sizeFormatted: isDir ? '-' : formatFileSize(file.size || 0),
          type: file.type,
          isDirectory: isDir,
          mimeType: isDir ? null : getMimeType(file.name),
          modifyTime: file.modifyTime || null,
          permissions: file.permissions || null,
          fullPath,
          remotePath: getFullRemotePath(fullPath)
        }
      })
  })

  let filtered = entries
  if (type === 'file') {
    filtered = filtered.filter(item => !item.isDirectory)
  } else if (type === 'dir') {
    filtered = filtered.filter(item => item.isDirectory)
  }
  if (search) {
    const kw = search.toLowerCase()
    filtered = filtered.filter(item => item.name.toLowerCase().includes(kw))
  }

  const directories = filtered.filter(f => f.isDirectory).length
  const filesCount = filtered.filter(f => !f.isDirectory).length

  if (page !== null && pageSize !== null) {
    const safePage = Math.max(1, parseInt(page) || 1)
    const safePageSize = Math.min(200, Math.max(1, parseInt(pageSize) || 50))
    const total = filtered.length
    const start = (safePage - 1) * safePageSize
    return {
      path: safeDir,
      files: filtered.slice(start, start + safePageSize),
      total,
      directories,
      filesCount,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / safePageSize))
      }
    }
  }

  return {
    path: safeDir,
    files: filtered,
    total: filtered.length,
    directories,
    filesCount
  }
}

export const getFtpEntryInfo = async (targetPath) => {
  const safePath = resolveSafeFtpPath(targetPath, { allowRoot: false })
  const parentDir = path.posix.dirname(safePath)
  const targetName = path.posix.basename(safePath)

  const entry = await withFtpClient(async (client) => {
    const entries = await client.list(parentDir === '.' ? '.' : parentDir)
    return entries.find(item => item.name === targetName) || null
  })

  if (!entry) {
    throw createError({ statusCode: 404, message: '文件或目录不存在' })
  }

  const isDir = entry.isDirectory === true || entry.type === 2
  return {
    name: entry.name,
    path: safePath,
    remotePath: getFullRemotePath(safePath),
    isDirectory: isDir,
    size: entry.size || 0,
    sizeFormatted: isDir ? '-' : formatFileSize(entry.size || 0),
    mimeType: isDir ? null : getMimeType(entry.name),
    modifyTime: entry.modifyTime || null,
    permissions: entry.permissions || null
  }
}

export const mkdirFtp = async ({ dirPath = '.', name }) => {
  const safeDir = resolveSafeFtpPath(dirPath || '.', { allowRoot: true })
  const targetName = validateEntryName(name)
  const fullPath = safeDir === '.' ? targetName : `${safeDir}/${targetName}`

  await withFtpClient(async (client) => {
    await client.ensureDir(fullPath)
  })

  invalidateFtpListCache()
  return {
    path: fullPath,
    remotePath: getFullRemotePath(fullPath)
  }
}

export const renameFtpEntry = async ({
  oldPath,
  newName,
  preserveExtension = false,
  autoDeduplicate = false
}) => {
  const safeOldPath = resolveSafeFtpPath(oldPath, { allowRoot: false })
  const validatedName = validateEntryName(newName)
  const parentDir = path.posix.dirname(safeOldPath)
  const oldFileName = path.posix.basename(safeOldPath)

  const targetBaseName = preserveExtension
    ? `${validatedName}${path.posix.extname(oldFileName)}`
    : validatedName

  const { actualNewName, newPath } = await withFtpClient(async (client) => {
    const listTarget = parentDir === '.' ? '.' : parentDir
    const fileList = await client.list(listTarget)
    const existingNames = new Set(fileList.map(f => f.name))

    if (!existingNames.has(oldFileName)) {
      throw createError({ statusCode: 404, message: `原文件 ${oldFileName} 不存在` })
    }

    if (targetBaseName === oldFileName) {
      return { actualNewName: oldFileName, newPath: safeOldPath }
    }

    let candidate = targetBaseName
    if (existingNames.has(candidate)) {
      if (!autoDeduplicate) {
        throw createError({ statusCode: 409, message: `目标名称 ${candidate} 已存在` })
      }
      const ext = path.posix.extname(targetBaseName)
      const stem = path.posix.basename(targetBaseName, ext)
      let counter = 1
      while (existingNames.has(candidate)) {
        candidate = `${stem}(${counter})${ext}`
        counter++
      }
    }

    const destPath = parentDir === '.' ? candidate : `${parentDir}/${candidate}`
    await client.rename(safeOldPath, destPath)
    return { actualNewName: candidate, newPath: destPath }
  })

  const oldRemotePath = getFullRemotePath(safeOldPath)
  const newRemotePath = getFullRemotePath(newPath)

  if (newPath !== safeOldPath) {
    invalidateFtpListCache()
    invalidateThumbnailCache(safeOldPath)

    try {
      const uploadHistoryRepository = await getUploadHistoryRepository()
      await uploadHistoryRepository.update(
        { remotePath: oldRemotePath },
        {
          fileName: actualNewName,
          remotePath: newRemotePath
        }
      )
    } catch (e) {
      console.warn('关联数据库更新失败', e)
    }
  }

  return {
    oldPath: safeOldPath,
    newName: actualNewName,
    newPath,
    newRemotePath
  }
}

export const deleteFtpEntry = async ({ targetPath, isDirectory = false, ignoreNotFound = false }) => {
  const safePath = resolveSafeFtpPath(targetPath, { allowRoot: false })

  await withFtpClient(async (client) => {
    try {
      if (isDirectory) {
        await client.removeDir(safePath)
      } else {
        await client.remove(safePath)
      }
    } catch (error) {
      if (isFtpNotFoundError(error)) {
        if (ignoreNotFound) return
        throw createError({ statusCode: 404, message: '目标文件或目录不存在' })
      }
      throw error
    }
  })

  const fullRemotePath = getFullRemotePath(safePath)
  invalidateFtpListCache()
  invalidateThumbnailCache(safePath)

  try {
    const uploadHistoryRepository = await getUploadHistoryRepository()
    if (isDirectory) {
      await uploadHistoryRepository.delete({ remotePath: Like(`${fullRemotePath}/%`) })
    } else {
      await uploadHistoryRepository.delete({ remotePath: fullRemotePath })
    }
  } catch (dbError) {
    console.warn('清理数据库记录失败 (非致命):', dbError)
  }

  return { path: safePath, remotePath: fullRemotePath }
}

const MAX_THUMBNAIL_SOURCE_BYTES = 20 * 1024 * 1024

export const serveFtpThumbnail = async (event, rawPath, rawSize) => {
  const safePath = resolveSafeFtpPath(rawPath, { allowRoot: false })
  const ext = getExtension(safePath).replace('.', '')

  if (!IMAGE_EXTENSIONS.includes(ext)) {
    throw createError({
      statusCode: 400,
      message: '非图片文件，无法生成缩略图'
    })
  }

  const requestedSize = parseInt(rawSize) || 120
  const thumbnailSize = Math.min(512, Math.max(16, requestedSize))

  const cached = getCachedThumbnail(safePath, thumbnailSize)
  if (cached) {
    setHeader(event, 'Content-Type', cached.contentType)
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    if (cached.contentType === 'image/svg+xml') {
      setHeader(event, 'Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
    }
    return cached.buffer
  }

  const sourceBuffer = await withFtpClient(async (client) => {
    try {
      const size = await client.size(safePath)
      if (size > MAX_THUMBNAIL_SOURCE_BYTES) {
        throw createError({ statusCode: 413, message: '原图过大，暂不生成缩略图' })
      }
    } catch (err) {
      if (err?.statusCode === 413) throw err
    }

    const chunks = []
    let totalLen = 0
    const writable = new Writable({
      write(chunk, encoding, callback) {
        totalLen += chunk.length
        if (totalLen > MAX_THUMBNAIL_SOURCE_BYTES) {
          callback(createError({ statusCode: 413, message: '原图过大，暂不生成缩略图' }))
          return
        }
        chunks.push(Buffer.from(chunk))
        callback()
      }
    })

    try {
      await client.downloadTo(writable, safePath)
    } catch (error) {
      if (isFtpNotFoundError(error)) {
        throw createError({ statusCode: 404, message: '图片不存在' })
      }
      throw error
    }

    return Buffer.concat(chunks)
  })

  let outputBuffer
  let contentType

  if (ext === 'bmp') {
    if (sourceBuffer.length > 5 * 1024 * 1024) {
      throw createError({ statusCode: 415, message: 'BMP 图片过大，暂不支持缩略图' })
    }
    outputBuffer = sourceBuffer
    contentType = 'image/bmp'
  } else {
    try {
      const resized = sharp(sourceBuffer).resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center'
      })

      if (ext === 'png' || ext === 'gif' || ext === 'svg') {
        outputBuffer = await resized.png({ quality: 80 }).toBuffer()
        contentType = 'image/png'
      } else if (ext === 'webp') {
        outputBuffer = await resized.webp({ quality: 80 }).toBuffer()
        contentType = 'image/webp'
      } else {
        outputBuffer = await resized.jpeg({ quality: 80, progressive: true }).toBuffer()
        contentType = 'image/jpeg'
      }
    } catch (sharpErr) {
      if (ext === 'svg' && sourceBuffer.length <= 512 * 1024) {
        outputBuffer = sourceBuffer
        contentType = 'image/svg+xml'
      } else {
        throw createError({
          statusCode: 422,
          message: `缩略图生成失败: ${sharpErr.message}`
        })
      }
    }
  }

  setCachedThumbnail(safePath, thumbnailSize, outputBuffer, contentType)

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (contentType === 'image/svg+xml') {
    setHeader(event, 'Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  }

  return outputBuffer
}

export const queryUploadHistory = async ({
  page = 1,
  pageSize = 10,
  search = '',
  fileCategory = 'all',
  sourceFilter = 'all',
  startDate = '',
  endDate = ''
} = {}) => {
  const safePage = Math.max(1, parseInt(page) || 1)
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 10))
  const searchTrimmed = String(search || '').trim()
  const startBoundary = parseDateBoundary(startDate, false)
  const endBoundary = parseDateBoundary(endDate, true)

  const where = {}
  if (searchTrimmed) {
    where.fileName = Like(`%${searchTrimmed}%`)
  }
  if (startBoundary && endBoundary) {
    where.uploadTime = Between(startBoundary, endBoundary)
  } else if (startBoundary) {
    where.uploadTime = MoreThanOrEqual(startBoundary)
  } else if (endBoundary) {
    where.uploadTime = LessThanOrEqual(endBoundary)
  }

  // 快速路径：仅查询数据库记录且无内存扩展名分类过滤时，直接走 SQL COUNT + LIMIT/OFFSET 分页
  if (sourceFilter === 'database' && fileCategory === 'all') {
    const uploadHistoryRepository = await getUploadHistoryRepository()
    const [rows, total] = await uploadHistoryRepository.findAndCount({
      where,
      order: { uploadTime: 'DESC' },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize
    })

    return {
      data: rows.map(item => ({
        id: item.id.toString(),
        fileName: item.fileName,
        fileSize: Number(item.fileSize),
        fileSizeFormatted: formatFileSize(Number(item.fileSize)),
        fileType: item.fileType,
        remotePath: item.remotePath,
        ipAddress: item.ipAddress || '-',
        userAgent: item.userAgent || '-',
        uploadTime: item.uploadTime ? new Date(item.uploadTime).toISOString() : new Date().toISOString(),
        source: 'database'
      })),
      source: 'database',
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / safePageSize))
      }
    }
  }

  let merged = []
  let source = 'database'
  const knownNames = new Set()

  // 1. 读取数据库记录（sourceFilter === 'ftp' 时仅拉取 fileName 做去重，减少传输）
  try {
    const uploadHistoryRepository = await getUploadHistoryRepository()
    if (sourceFilter === 'ftp') {
      const nameRows = await uploadHistoryRepository.find({ select: ['fileName'] })
      for (const row of nameRows) {
        knownNames.add(row.fileName)
      }
    } else {
      const rows = await uploadHistoryRepository.find({
        where,
        order: { uploadTime: 'DESC' }
      })
      for (const item of rows) {
        knownNames.add(item.fileName)
        merged.push({
          id: item.id.toString(),
          fileName: item.fileName,
          fileSize: Number(item.fileSize),
          fileSizeFormatted: formatFileSize(Number(item.fileSize)),
          fileType: item.fileType,
          remotePath: item.remotePath,
          ipAddress: item.ipAddress || '-',
          userAgent: item.userAgent || '-',
          uploadTime: item.uploadTime ? new Date(item.uploadTime).toISOString() : new Date().toISOString(),
          source: 'database'
        })
      }
    }
  } catch (dbError) {
    console.error('数据库查询失败:', dbError)
    source = 'ftp'
  }

  // 2. 补充 FTP 根目录中尚未记录到数据库的文件
  if (sourceFilter !== 'database') {
    const searchLower = searchTrimmed.toLowerCase()
    try {
      const fileList = await getCachedFtpList()
      for (const file of fileList) {
        if (file.name === '.' || file.name === '..') continue
        if (file.isDirectory === true || file.type === 2) continue
        if (knownNames.has(file.name)) continue
        if (searchLower && !file.name.toLowerCase().includes(searchLower)) continue

        merged.push({
          id: `ftp_${file.name}`,
          fileName: file.name,
          fileSize: file.size || 0,
          fileSizeFormatted: formatFileSize(file.size || 0),
          fileType: getMimeType(file.name),
          remotePath: getFullRemotePath(file.name),
          ipAddress: '-',
          userAgent: '-',
          uploadTime: file.modifyTime ? new Date(file.modifyTime).toISOString() : new Date().toISOString(),
          source: 'ftp'
        })
      }
    } catch (ftpError) {
      console.error('FTP 文件列表读取失败:', ftpError)
    }
  }

  // 3. 过滤分类、来源与日期（FTP 补充记录需在内存补做日期筛选）
  if (fileCategory !== 'all') {
    merged = merged.filter(item => getFileCategory(item.fileName) === fileCategory)
  }
  if (sourceFilter !== 'all') {
    merged = merged.filter(item => item.source === sourceFilter)
  }
  if (startBoundary) {
    const startTs = startBoundary.getTime()
    merged = merged.filter(item => new Date(item.uploadTime).getTime() >= startTs)
  }
  if (endBoundary) {
    const endTs = endBoundary.getTime()
    merged = merged.filter(item => new Date(item.uploadTime).getTime() <= endTs)
  }

  // 4. 倒序排序 & 内存分页
  merged.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))

  const total = merged.length
  const startIndex = (safePage - 1) * safePageSize
  const paginatedData = merged.slice(startIndex, startIndex + safePageSize)

  return {
    data: paginatedData,
    source,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize))
    }
  }
}
