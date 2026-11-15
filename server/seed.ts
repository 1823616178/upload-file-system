import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { UploadHistory } from './entities/UploadHistory'
import { User } from './entities/User'
import * as crypto from 'crypto'

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NUXT_DB_HOST || process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.NUXT_DB_PORT || process.env.DB_PORT || '3306'),
  username: process.env.NUXT_DB_USER || process.env.DB_USER || 'hanvon',
  password: process.env.NUXT_DB_PASSWORD || process.env.DB_PASSWORD || 'hanvon123',
  database: process.env.NUXT_DB_NAME || process.env.DB_NAME || 'hanvon_tools_database',
  entities: [UploadHistory, User],
  synchronize: false,
  logging: ['error', 'warn'],
  charset: 'utf8mb4',
  timezone: '+08:00',
})

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(salt + ':' + derivedKey.toString('hex'))
    })
  })
}

async function main() {
  const seedUsername = process.env.SEED_USERNAME || 'hccloud'
  const seedPassword = process.env.SEED_PASSWORD

  if (!seedPassword) {
    throw new Error('缺少 SEED_PASSWORD 环境变量（拒绝使用内置默认口令）')
  }

  // 初始化数据源
  await AppDataSource.initialize()
  console.log('数据源初始化成功')

  const userRepository = AppDataSource.getRepository(User)

  // 创建/更新默认用户
  const hashedPassword = await hashPassword(seedPassword)

  // 检查用户是否已存在
  const existingUser = await userRepository.findOne({
    where: { username: seedUsername }
  })

  if (existingUser) {
    console.log('用户已存在，更新密码...')
    existingUser.password = hashedPassword
    await userRepository.save(existingUser)
    console.log('用户密码已更新')
  } else {
    const user = userRepository.create({
      username: seedUsername,
      password: hashedPassword
    })
    await userRepository.save(user)
    console.log('默认用户创建成功:', user.username)
  }

  await AppDataSource.destroy()
  console.log('数据库连接已关闭')
}

main()
  .then(() => {
    console.log('种子数据执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('种子数据执行失败:', error)
    process.exit(1)
  })
