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
    ftpBasePath: process.env.NUXT_FTP_BASE_PATH || process.env.FTP_BASE_PATH || '/static/zhonghuaguji/wenjinyangji',
    // 对外接口访问密钥（支持逗号分隔多个，或使用 "名称:密钥" 格式便于审计）
    apiKeys: process.env.NUXT_API_KEYS || process.env.API_KEYS || ''
  },
  css: ['~/assets/styles/app.scss'],
  app: {
    pageTransition: { name: 'page-fade', mode: 'out-in' },
    layoutTransition: { name: 'layout-fade', mode: 'out-in' },
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
