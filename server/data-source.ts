import 'reflect-metadata'
import fs from 'fs'
import path from 'path'
import { DataSource } from 'typeorm'
import { UploadHistory } from './entities/UploadHistory'
import { User } from './entities/User'

// 兼容 CLI 脚本（npm run typeorm:seed / migration:*）直接读取项目根目录 .env（不覆盖已注入的环境变量）
const envFilePath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envFilePath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFilePath)
}

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
