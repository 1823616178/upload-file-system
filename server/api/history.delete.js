import fs from 'fs'
import path from 'path'

// 历史记录存储文件路径
const HISTORY_FILE = path.join(process.cwd(), 'upload-history.json')

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    if (!id) {
      throw new Error('缺少记录 ID')
    }

    // 读取历史记录
    let history = []
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      history = JSON.parse(data)
    }

    // 查找并删除记录
    const initialLength = history.length
    history = history.filter(item => item.id !== id)

    if (history.length === initialLength) {
      return {
        success: false,
        error: '未找到该记录'
      }
    }

    // 保存更新后的历史记录
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))

    return {
      success: true,
      message: '记录删除成功'
    }
  } catch (error) {
    console.error('删除历史记录失败:', error)
    return {
      success: false,
      error: error.message || '删除历史记录失败'
    }
  }
})
