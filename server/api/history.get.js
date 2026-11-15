import { Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'
import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { withFtpClient } from '~/server/utils/ftp.js'
import { formatFileSize, getFileCategory } from '~/server/utils/file-info.js'

// FTP 根目录列表的内存缓存：翻页/筛选时避免每次都重新连接 FTP 拉全量列表
const FTP_LIST_CACHE_TTL = 30 * 1000
let ftpListCache = null // { data, expiresAt }

const getCachedFtpList = async () => {
  if (ftpListCache && Date.now() < ftpListCache.expiresAt) {
    return ftpListCache.data
  }
  const data = await withFtpClient(async (client) => client.list())
  ftpListCache = { data, expiresAt: Date.now() + FTP_LIST_CACHE_TTL }
  return data
}

export default defineEventHandler(async (event) => {
  try {
    // 读取查询参数
    const queryStr = getQuery(event)
    const page = parseInt(queryStr.page) || 1
    const pageSize = parseInt(queryStr.pageSize) || 10
    const search = queryStr.search || ''
    const fileCategory = queryStr.fileCategory || 'all' // all | image | document | archive | font | other
    const sourceFilter = queryStr.source || 'all' // all | database | ftp
    const startDate = queryStr.startDate || '' // YYYY-MM-DD
    const endDate = queryStr.endDate || '' // YYYY-MM-DD

    const config = useRuntimeConfig()
    const ftpBasePath = config.ftpBasePath || '/static/zhonghuaguji/wenjinyangji'

    // 合并数据库记录与 FTP 文件列表：
    // - 数据库有记录的文件用数据库信息（含 IP、上传时间等）
    // - 数据库没有记录、但 FTP 上存在的文件用 FTP 信息补充
    // 以文件名为去重键
    let merged = []
    let source = 'database'

    // 1. 读取数据库记录（搜索/日期过滤下推到 SQL，减少内存处理量）
    try {
      const uploadHistoryRepository = await getUploadHistoryRepository()

      const where = {}
      if (search) {
        where.fileName = Like(`%${search}%`)
      }
      if (startDate && endDate) {
        where.uploadTime = Between(new Date(startDate + 'T00:00:00'), new Date(endDate + 'T23:59:59.999'))
      } else if (startDate) {
        where.uploadTime = MoreThanOrEqual(new Date(startDate + 'T00:00:00'))
      } else if (endDate) {
        where.uploadTime = LessThanOrEqual(new Date(endDate + 'T23:59:59.999'))
      }

      const data = await uploadHistoryRepository.find({
        where,
        order: { uploadTime: 'DESC' }
      })

      merged = data.map(item => ({
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
      }))
    } catch (dbError) {
      console.error('数据库查询失败:', dbError)
      // 数据库失败时，仅依赖 FTP 列表
      source = 'ftp'
    }

    // 已在数据库中的文件名集合，用于去重
    const knownNames = new Set(merged.map(item => item.fileName))
    const searchLower = search.toLowerCase()

    // 2. 读取 FTP 文件列表（带缓存），补充数据库中没有的文件
    try {
      const fileList = await getCachedFtpList()

      for (const file of fileList) {
        if (file.name === '.' || file.name === '..') continue
        if (file.type === 2) continue // 跳过目录（basic-ftp: 2 = directory）
        if (knownNames.has(file.name)) continue // 数据库已有，跳过
        if (search && !file.name.toLowerCase().includes(searchLower)) continue // 搜索过滤

        merged.push({
          id: `ftp_${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          fileSizeFormatted: formatFileSize(file.size),
          fileType: file.type || 'application/octet-stream',
          remotePath: `${ftpBasePath.replace(/\/$/, '')}/${file.name}`,
          ipAddress: '-',
          userAgent: '-',
          uploadTime: file.modifyTime ? new Date(file.modifyTime).toISOString() : new Date().toISOString(),
          source: 'ftp'
        })
      }
    } catch (ftpError) {
      console.error('FTP 文件列表读取失败:', ftpError)
      // FTP 读取失败不影响数据库记录的返回
    }

    // 3. 应用筛选条件（文件类型分类 / 来源）
    // 上传时间范围对数据库记录已下推 SQL，这里对 FTP 补充记录仍需内存过滤
    if (fileCategory !== 'all') {
      merged = merged.filter(item => getFileCategory(item.fileName) === fileCategory)
    }
    if (sourceFilter !== 'all') {
      merged = merged.filter(item => item.source === sourceFilter)
    }
    if (startDate) {
      const startTime = new Date(startDate + 'T00:00:00').getTime()
      merged = merged.filter(item => new Date(item.uploadTime).getTime() >= startTime)
    }
    if (endDate) {
      const endTime = new Date(endDate + 'T23:59:59.999').getTime()
      merged = merged.filter(item => new Date(item.uploadTime).getTime() <= endTime)
    }

    // 4. 合并后统一按上传时间倒序排序
    merged.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))

    // 5. 内存分页
    const total = merged.length
    const startIndex = (page - 1) * pageSize
    const paginatedData = merged.slice(startIndex, startIndex + pageSize)

    return {
      success: true,
      data: paginatedData,
      source,
      pagination: {
        page: page,
        pageSize: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    return {
      success: false,
      error: error.message || '获取历史记录失败'
    }
  }
})
