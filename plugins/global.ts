export default defineNuxtPlugin((nuxtApp) => {
  // 这里可以添加全局配置
  // 例如：初始化第三方库、注册全局组件等
  
  // 示例：添加全局属性
  nuxtApp.provide('globalConfig', {
    appName: '文件传输中心',
    version: '1.0.0'
  })
})
