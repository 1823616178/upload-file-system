import fs from 'fs'
import path from 'path'

// 历史记录存储文件路径
const HISTORY_FILE = path.join(process.cwd(), 'upload-history.json')

export default defineEventHandler(async (event) => {
  try {
    // 读取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const pageSize = parseInt(query.pageSize) || 10
    const search = query.search || ''

    // 读取历史记录
    let history = []
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      history = JSON.parse(data)
    }

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      history = history.filter(item =>
        item.fileName.toLowerCase().includes(searchLower)
      )
    }

    // 分页处理
    const total = history.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedHistory = history.slice(startIndex, endIndex)

    return {
      success: true,
      data: paginatedHistory,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: total,
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
