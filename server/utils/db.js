import { PrismaClient } from '@prisma/client'

// 全局 Prisma 实例
const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

// 开发环境下启用日志
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query)
    console.log('Params: ' + e.params)
    console.log('Duration: ' + e.duration + 'ms')
  })
}

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
