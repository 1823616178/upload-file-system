import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { UploadHistory } from './entities/UploadHistory'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: '192.168.1.111',
  port: 53306,
  username: 'hanvon',
  password: 'hanvon123',
  database: 'hanvon_tools_database',
  entities: [UploadHistory, User],
  synchronize: false, // 生产环境设为 false
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error', 'warn'],
  charset: 'utf8mb4',
  timezone: '+08:00',
})
