import { Client } from 'basic-ftp'

export const createFtpClient = async () => {
  const config = useRuntimeConfig()
  const client = new Client()
  
  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      port: config.ftp.port,
      secure: config.ftp.secure
    })
    return client
  } catch (error) {
    client.close()
    throw new Error(`FTP connection failed: ${error.message}`)
  }
}
