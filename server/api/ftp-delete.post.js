export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { path, isDirectory } = body

    if (!path) {
      throw new Error('缺少文件路径参数')
    }

    const client = await createFtpClient()

    try {
      if (isDirectory) {
        // 递归删除目录
        await client.removeDir(path)
        console.log(`FTP 删除目录成功: ${path}`)
      } else {
        // 删除文件
        await client.remove(path)
        console.log(`FTP 删除文件成功: ${path}`)
      }

      return {
        success: true,
        message: isDirectory ? '目录删除成功' : '文件删除成功'
      }
    } catch (ftpError) {
      console.error('FTP 删除失败:', ftpError)
      throw new Error(`删除失败: ${ftpError.message}`)
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('删除操作失败:', error)
    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
})
