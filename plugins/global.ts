export default defineNuxtPlugin((nuxtApp) => {
  // 这里可以添加全局配置
  // 例如：初始化第三方库、注册全局组件等
  
  // 示例：添加全局属性
  nuxtApp.provide('globalConfig', {
    appName: '汉王数字文件上传系统',
    version: '1.0.0'
  })
})
