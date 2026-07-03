// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: {
    tsConfig: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictPropertyInitialization: false
      }
    }
  },
  nitro: {
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true
          }
        }
      }
    }
  },
  runtimeConfig: {
    ftp: {
      host: process.env.NUXT_FTP_HOST || process.env.FTP_HOST,
      user: process.env.NUXT_FTP_USER || process.env.FTP_USER,
      password: process.env.NUXT_FTP_PASSWORD || process.env.FTP_PASSWORD,
      port: parseInt(process.env.NUXT_FTP_PORT || process.env.FTP_PORT || '21'),
      secure: (process.env.NUXT_FTP_SECURE || process.env.FTP_SECURE) === 'true'
    },
    ssh: {
      host: process.env.NUXT_SSH_HOST || process.env.SSH_HOST,
      user: process.env.NUXT_SSH_USER || process.env.SSH_USER,
      password: process.env.NUXT_SSH_PASSWORD || process.env.SSH_PASSWORD,
      port: parseInt(process.env.NUXT_SSH_PORT || process.env.SSH_PORT || '22')
    },
    ftpBasePath: process.env.NUXT_FTP_BASE_PATH || process.env.FTP_BASE_PATH || '/static/zhonghuaguji/wenjinyangji'
  },
  app: {
    head: {
      title: '汉王数字文件上传系统',
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo-black.png' }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
