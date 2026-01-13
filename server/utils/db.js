import 'reflect-metadata'
import { AppDataSource } from '../data-source'
import { UploadHistory } from '../entities/UploadHistory'
import { User } from '../entities/User'

// 初始化数据源
let isInitialized = false

const initializeDataSource = async () => {
  if (!isInitialized) {
    try {
      await AppDataSource.initialize()
      isInitialized = true
      console.log('TypeORM 数据源已初始化')
    } catch (error) {
      console.error('TypeORM 初始化失败:', error)
      throw error
    }
  }
  return AppDataSource
}

// 优雅关闭
process.on('beforeExit', async () => {
  if (isInitialized && AppDataSource.isInitialized) {
    await AppDataSource.destroy()
    console.log('TypeORM 连接已关闭')
  }
})

// 导出初始化函数和仓库获取器
export const getDataSource = async () => {
  return await initializeDataSource()
}

export const getUploadHistoryRepository = async () => {
  const dataSource = await initializeDataSource()
  return dataSource.getRepository(UploadHistory)
}

export const getUserRepository = async () => {
  const dataSource = await initializeDataSource()
  return dataSource.getRepository(User)
}

// 默认导出数据源访问器
export default {
  getDataSource,
  getUploadHistoryRepository,
  getUserRepository
}
