import { Client } from 'basic-ftp'
import prisma from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // 读取查询参数
    const queryStr = getQuery(event)
    const page = parseInt(queryStr.page) || 1
    const pageSize = parseInt(queryStr.pageSize) || 10
    const search = queryStr.search || ''

    // 连接 FTP 服务器获取文件信息
    const client = new Client()
    const ftpFiles = []

    try {
      await client.access({
        host: '192.168.1.166',
        user: 'userftp',
        password: '550312171',
        port: 21,
        secure: false
      })

      // 列出目录中的文件
      const fileList = await client.list('/static/wenjinyangyi')

      console.log('FTP 文件列表:', fileList)

      // 转换文件信息
      for (const file of fileList) {
        if (file.name === '.' || file.name === '..') continue
        
        ftpFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          modifyTime: file.modifyTime,
          remotePath: `/static/wenjinyangyi/${file.name}`
        })
      }
    } catch (ftpError) {
      console.error('FTP 连接失败:', ftpError)
    } finally {
      client.close()
    }

    // 如果 FTP 无法连接，回退到数据库记录
    let historyData = []
    let total = 0

    if (ftpFiles.length > 0) {
      // 使用 FTP 文件列表
      historyData = ftpFiles.map(file => ({
        id: Date.now() + Math.random(),
        fileName: file.name,
        fileSize: file.size,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: file.type || 'application/octet-stream',
        remotePath: file.remotePath,
        uploadTime: file.modifyTime ? file.modifyTime.toISOString() : new Date().toISOString(),
        source: 'ftp' // 标记来源为 FTP
      }))

      total = historyData.length
    } else {
      // 回退到数据库
      console.log('使用数据库历史记录')

      // 构建 Prisma 查询条件
      const where = {}

      // 搜索过滤
      if (search) {
        where.fileName = {
          contains: search
        }
      }

      // 获取总数
      total = await prisma.uploadHistory.count({ where })

      // 分页查询
      const data = await prisma.uploadHistory.findMany({
        where,
        orderBy: {
          uploadTime: 'desc'
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
    }

    // 客户端分页
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = ftpFiles.length > 0
      ? historyData.slice(startIndex, endIndex)
      : historyData

    return {
      success: true,
      data: paginatedData,
      source: ftpFiles.length > 0 ? 'ftp' : 'database',
      pagination: {
        page: page,
        pageSize: pageSize,
        total: ftpFiles.length > 0 ? ftpFiles.length : total,
        totalPages: Math.ceil((ftpFiles.length > 0 ? ftpFiles.length : total) / pageSize)
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
