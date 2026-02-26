export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const searchPattern = query.q
        let basePath = query.path || '.'

        // 如果路径以 / 开头，去掉它，使其相对于 SSH 用户主目录
        // 根据用户反馈，SSH 登录后 ls 显示 static，说明 /static 应该是 relative path 'static'
        if (basePath.startsWith('/')) {
            basePath = basePath.substring(1)
        }
        if (!basePath) {
            basePath = '.'
        }

        if (!searchPattern) {
            return { success: false, error: '缺少搜索关键词' }
        }

        // 使用 printf 输出类型和路径，格式: Type|Path
        // %y 返回 f(file), d(directory)
        // %p 返回路径
        // %s 返回大小
        const cmd = `find ${basePath} -name "*${searchPattern}*" -printf "%y|%s|%p\\n" 2>/dev/null`

        console.log('执行 SSH 搜索命令:', cmd)

        const output = await executeSshCommand(cmd)

        const rawLines = output.split('\n').filter(Boolean)
        const MAX_RESULTS = 100

        const results = rawLines.slice(0, MAX_RESULTS).map(line => {
            const [type, size, ...pathParts] = line.split('|')
            let fullPath = pathParts.join('|') // 防止文件名中含有 |

            // 确保返回绝对路径
            if (fullPath.startsWith('./')) {
                fullPath = fullPath.substring(1) // ./foo -> /foo
            } else if (!fullPath.startsWith('/')) {
                fullPath = '/' + fullPath // foo -> /foo
            }

            const name = fullPath.split('/').pop()

            return {
                name: name,
                fullPath: fullPath,
                isDirectory: type === 'd',
                size: parseInt(size) || 0,
                // 添加一个标识，表示这是搜索结果
                isSearchResult: true
            }
        })

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
