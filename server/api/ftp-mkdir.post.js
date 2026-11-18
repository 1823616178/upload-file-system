import { readBody } from 'h3'
import { mkdirFtp } from '~/server/utils/ftp-operations.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { path: dirPath, name } = body || {}

    const result = await mkdirFtp({
      dirPath: dirPath || '.',
      name
    })

    return {
      success: true,
      message: '文件夹创建成功',
      path: result.path
    }
  } catch (error) {
    console.error('创建文件夹失败:', error)
    return {
      success: false,
      error: error.statusMessage || error.message || '创建文件夹失败'
    }
  }
})
