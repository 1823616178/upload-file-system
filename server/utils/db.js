import 'reflect-metadata'
import { AppDataSource } from '../data-source'
import { UploadHistory } from '../entities/UploadHistory'
import { User } from '../entities/User'

// 并发安全的单例初始化（避免冷启动并发请求同时调用 initialize()）
let initPromise = null

const initializeDataSource = async () => {
  if (AppDataSource.isInitialized) {
    return AppDataSource
  }
  if (!initPromise) {
    initPromise = AppDataSource.initialize()
      .then(() => {
        console.log('TypeORM 数据源已初始化')
        return AppDataSource
      })
      .catch((error) => {
        initPromise = null
        console.error('TypeORM 初始化失败:', error)
        throw error
      })
  }
  return initPromise
}

// 说明：连接随进程生命周期存续，不做显式 destroy；
// Nitro 服务器常驻事件循环，process.on('beforeExit') 不会被触发

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
