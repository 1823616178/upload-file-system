import { getUploadHistoryRepository } from '~/server/utils/db.js'
import { Like } from 'typeorm'

export default defineEventHandler(async (event) => {
  try {
    // 读取查询参数
    const queryStr = getQuery(event)
    const page = parseInt(queryStr.page) || 1
    const pageSize = parseInt(queryStr.pageSize) || 10
    const search = queryStr.search || ''

    const config = useRuntimeConfig()
    const ftpBasePath = config.ftpBasePath || '/static/zhonghuaguji/wenjinyangji'
    console.log('history.get 使用 FTP 基础路径:', ftpBasePath)

    // 历史记录以数据库为准，FTP 仅作为兜底补充
    let historyData = []
    let total = 0
    let source = 'database'

    try {
      const uploadHistoryRepository = await getUploadHistoryRepository()

      // 构建 TypeORM 查询条件
      const where = {}

      // 搜索过滤
      if (search) {
        where.fileName = Like(`%${search}%`)
      }

      // 获取总数
      total = await uploadHistoryRepository.count({ where })

      // 分页查询
      const data = await uploadHistoryRepository.find({
        where,
        order: {
          uploadTime: 'DESC'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })

      // 格式化返回数据
      historyData = data.map(item => ({
        id: item.id.toString(),
        fileName: item.fileName,
        fileSize: Number(item.fileSize),
        fileSizeFormatted: formatFileSize(Number(item.fileSize)),
        fileType: item.fileType,
        remotePath: item.remotePath,
        ipAddress: item.ipAddress || '-',
        userAgent: item.userAgent || '-',
        uploadTime: item.uploadTime ? new Date(item.uploadTime).toISOString() : new Date().toISOString(),
        source: 'database' // 标记来源为数据库
      }))
    } catch (dbError) {
      console.error('数据库查询失败:', dbError)
      // 数据库失败时，回退到 FTP 列表
      source = 'ftp'
    }

    // 如果数据库为空，尝试从 FTP 读取作为兜底
    if (historyData.length === 0 && total === 0) {
      console.log('数据库为空，尝试从 FTP 获取文件列表')
      const client = await createFtpClient()
      const ftpFiles = []

      try {
        // createFtpClient 内部已切换到 ftpBasePath，直接 list() 即可
        const fileList = await client.list()
        console.log('FTP 兜底文件列表:', fileList)

        for (const file of fileList) {
          if (file.name === '.' || file.name === '..') continue

          ftpFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            modifyTime: file.modifyTime,
            remotePath: `${ftpBasePath.replace(/\/$/, '')}/${file.name}`
          })
        }

        if (ftpFiles.length > 0) {
          historyData = ftpFiles.map(file => ({
            id: `ftp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileSize: file.size,
            fileSizeFormatted: formatFileSize(file.size),
            fileType: file.type || 'application/octet-stream',
            remotePath: file.remotePath,
            ipAddress: '-',
            userAgent: '-',
            uploadTime: file.modifyTime ? file.modifyTime.toISOString() : new Date().toISOString(),
            source: 'ftp'
          }))

          total = historyData.length
          source = 'ftp'
        }
      } catch (ftpError) {
        console.error('FTP 兜底读取失败:', ftpError)
      } finally {
        client.close()
      }
    }

    // 客户端分页（数据库查询已分页，仅 FTP 兜底需要切片）
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = source === 'ftp' && total > pageSize
      ? historyData.slice(startIndex, endIndex)
      : historyData

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

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
