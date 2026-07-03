import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { UploadHistory } from './entities/UploadHistory'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NUXT_DB_HOST || process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.NUXT_DB_PORT || process.env.DB_PORT || '3306'),
  username: process.env.NUXT_DB_USER || process.env.DB_USER || 'hanvon',
  password: process.env.NUXT_DB_PASSWORD || process.env.DB_PASSWORD || 'hanvon123',
  database: process.env.NUXT_DB_NAME || process.env.DB_NAME || 'hanvon_tools_database',
  entities: [UploadHistory, User],
  synchronize: false, // 生产环境设为 false
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error', 'warn'],
  charset: 'utf8mb4',
  timezone: '+08:00',
})
