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
      host: process.env.FTP_HOST || '192.168.1.166',
      user: process.env.FTP_USER || 'userftp',
      password: process.env.FTP_PASSWORD || '550312171',
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: process.env.FTP_SECURE === 'true'
    }
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