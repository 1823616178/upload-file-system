// 通过 basic-ftp 客户端递归遍历目录搜索，避免拼接 shell 命令带来的命令注入风险，
// 并且与 ftp-directory.get.js 使用同一套路径基准（相对 FTP 会话当前目录），保证
// 搜索结果的 fullPath 可以直接被前端用于导航/预览。
const MAX_RESULTS = 100
const MAX_DEPTH = 6 // 限制递归深度，避免目录层级过深导致遍历耗时过长

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const searchPattern = (query.q || '').trim()
    const basePath = query.path || '.'

    if (!searchPattern) {
      return { success: false, error: '缺少搜索关键词' }
    }

    const patternLower = searchPattern.toLowerCase()
    const results = []

    const client = await createFtpClient()

    const walk = async (dirPath, depth) => {
      if (results.length >= MAX_RESULTS || depth > MAX_DEPTH) return

      let entries
      try {
        entries = await client.list(dirPath)
      } catch (e) {
        console.warn(`无法列出目录 ${dirPath}:`, e.message)
        return
      }

      for (const entry of entries) {
        if (results.length >= MAX_RESULTS) return
        if (entry.name === '.' || entry.name === '..') continue

        const isDir = entry.isDirectory === true || entry.type === 2
        const fullPath = dirPath === '.' ? entry.name : `${dirPath}/${entry.name}`

        if (entry.name.toLowerCase().includes(patternLower)) {
          results.push({
            name: entry.name,
            fullPath,
            isDirectory: isDir,
            size: entry.size || 0,
            isSearchResult: true
          })
        }

        if (isDir) {
          await walk(fullPath, depth + 1)
        }
      }
    }

    try {
      await walk(basePath, 0)
    } finally {
      client.close()
    }

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('搜索失败:', error)
    return {
      success: false,
      error: '搜索失败: ' + error.message
    }
  }
})
