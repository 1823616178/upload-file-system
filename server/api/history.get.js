import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { Like } from 'typeorm'

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
    console.log('history.get 使用 FTP 基础路径:', ftpBasePath)

    // 合并数据库记录与 FTP 文件列表：
    // - 数据库有记录的文件用数据库信息（含 IP、上传时间等）
    // - 数据库没有记录、但 FTP 上存在的文件用 FTP 信息补充
    // 以文件名为去重键
    let merged = []
    let source = 'database'

    // 1. 读取全部数据库记录（含搜索过滤）
    try {
      const uploadHistoryRepository = await getUploadHistoryRepository()

      const where = {}
      if (search) {
        where.fileName = Like(`%${search}%`)
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

    // 2. 读取 FTP 文件列表，补充数据库中没有的文件
    try {
      const client = await createFtpClient()
      try {
        // createFtpClient 内部已切换到 ftpBasePath，直接 list() 即可
        const fileList = await client.list()

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
      } finally {
        client.close()
      }
    } catch (ftpError) {
      console.error('FTP 文件列表读取失败:', ftpError)
      // FTP 读取失败不影响数据库记录的返回
    }

    // 3. 应用筛选条件（文件类型分类 / 来源 / 上传时间范围）
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

// 根据文件名扩展名判断分类
const FILE_CATEGORY_MAP = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.xml', '.json'],
  archive: ['.zip', '.rar', '.7z'],
  font: ['.ttf', '.otf', '.woff', '.woff2']
}
const getFileCategory = (filename) => {
  const ext = ('.' + (filename.split('.').pop() || '')).toLowerCase()
  for (const [category, extensions] of Object.entries(FILE_CATEGORY_MAP)) {
    if (extensions.includes(ext)) return category
  }
  return 'other'
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
