import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  const username = 'hanvon'
  const passwordRaw = 'hanvon123'
  
  const hashedPassword = await hashPassword(passwordRaw)

  const user = await prisma.user.upsert({
    where: { username: username },
    update: {
      password: hashedPassword
    },
    create: {
      username: username,
      password: hashedPassword,
    },
  })

  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
