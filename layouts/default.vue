<template>
  <div class="app-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration" aria-hidden="true">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-lines"></div>
      <div class="particles"></div>
    </div>

    <!-- 导航栏 -->
    <header class="navbar" :class="{ scrolled: isScrolled }">
      <div class="nav-content">
        <LogoParticles>
          <NuxtLink to="/" class="logo-link">
            <div class="logo">
              <img src="/logo-black.png" alt="汉王数字 Logo" class="logo-img" />
              <span class="logo-text">汉王数字文件上传系统</span>
            </div>
          </NuxtLink>
        </LogoParticles>

        <nav class="nav-links" aria-label="主导航">
          <NuxtLink to="/" class="nav-link">
            <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>首页</span>
          </NuxtLink>
          <NuxtLink to="/uploadFile" class="nav-link">
            <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>文件上传</span>
          </NuxtLink>
          <NuxtLink to="/history" class="nav-link">
            <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15.5 14" />
            </svg>
            <span>历史记录</span>
          </NuxtLink>
          <NuxtLink to="/ftp-manager" class="nav-link">
            <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>FTP 管理</span>
          </NuxtLink>
          <button type="button" @click="logout" class="nav-logout-btn" :disabled="loggingOut">
            <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{{ loggingOut ? '退出中...' : '注销' }}</span>
          </button>
        </nav>

        <!-- 移动端汉堡按钮 -->
        <button
          type="button"
          class="mobile-menu-toggle"
          :class="{ active: mobileMenuOpen }"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-expanded="mobileMenuOpen"
          aria-label="切换导航菜单"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- 移动端下拉导航抽屉 -->
      <Transition name="drawer-slide">
        <div v-if="mobileMenuOpen" class="mobile-nav-drawer">
          <NuxtLink to="/" class="mobile-nav-link">首页</NuxtLink>
          <NuxtLink to="/uploadFile" class="mobile-nav-link">文件上传</NuxtLink>
          <NuxtLink to="/history" class="mobile-nav-link">历史记录</NuxtLink>
          <NuxtLink to="/ftp-manager" class="mobile-nav-link">FTP 管理</NuxtLink>
          <button type="button" @click="logout" class="mobile-nav-link logout" :disabled="loggingOut">
            {{ loggingOut ? '正在注销...' : '注销登录' }}
          </button>
        </div>
      </Transition>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p class="footer-text">© 2026 汉王数字文件上传系统 · 智能科技 · 服务未来</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const loggingOut = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 12
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)

const logout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await fetch('/api/logout', { method: 'POST' })
  } finally {
    loggingOut.value = false
    mobileMenuOpen.value = false
    router.push('/login')
  }
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
