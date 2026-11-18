import 'reflect-metadata'
import * as crypto from 'crypto'
import { AppDataSource } from './data-source'
import { User } from './entities/User'

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
  const seedUsername = (process.env.SEED_USERNAME || 'hccloud').trim() || 'hccloud'
  const seedPassword = process.env.SEED_PASSWORD?.trim()

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
