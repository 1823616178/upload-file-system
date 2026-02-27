import { Client } from 'basic-ftp'

export const createFtpClient = async () => {
  const config = useRuntimeConfig()
  const client = new Client()

  console.log('FTP Config:', config.ftp)
  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      port: config.ftp.port,
      secure: config.ftp.secure
    })

    // 切换到基础路径
    if (config.ftpBasePath) {
      await client.ensureDir(config.ftpBasePath)
      await client.cd(config.ftpBasePath)
      const currentDir = await client.pwd()
      console.log(`FTP 当前目录: ${currentDir}`)
    }

    return client
  } catch (error) {
    client.close()
    throw new Error(`FTP connection failed: ${error.message}`)
  }
}
