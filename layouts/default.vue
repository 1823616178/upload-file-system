<template>
  <div class="app-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-lines"></div>
      <div class="particles"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <div class="logo">
          <svg viewBox="0 0 48 48" class="logo-icon">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#00d4ff"/>
                <stop offset="100%" style="stop-color:#0099ff"/>
              </linearGradient>
            </defs>
            <path d="M24 4 L44 14 V34 L24 44 L4 34 V14 Z" stroke="url(#logoGrad)" stroke-width="2" fill="none"/>
            <circle cx="24" cy="24" r="8" stroke="url(#logoGrad)" stroke-width="2" fill="none"/>
            <circle cx="24" cy="24" r="3" fill="url(#logoGrad)"/>
          </svg>
          <span class="logo-text">文件传输中心</span>
        </div>
        <div class="nav-links">
          <NuxtLink to="/" class="nav-link">首页</NuxtLink>
          <NuxtLink to="/uploadFile" class="nav-link">文件上传</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p class="footer-text">© 2026 文件传输中心 · 智能科技 · 服务未来</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Nuxt 布局组件，使用 NuxtLink 进行路由导航
definePageMeta({
  layout: 'default'
})
</script>

<style scoped lang="scss">
@import '~/assets/styles/app.scss';
</style>
