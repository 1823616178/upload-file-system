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
        <LogoParticles>
          <NuxtLink to="/" class="logo-link">
            <div class="logo">
              <img src="/logo-black.png" alt="Logo" class="logo-img" />
              <span class="logo-text">汉王数字文件上传系统</span>
            </div>
          </NuxtLink>
        </LogoParticles>
        <div class="nav-links">
          <NuxtLink to="/" class="nav-link">首页</NuxtLink>
          <NuxtLink to="/uploadFile" class="nav-link">文件上传</NuxtLink>
          <NuxtLink to="/history" class="nav-link">历史记录</NuxtLink>
          <NuxtLink to="/ftp-manager" class="nav-link">FTP 管理</NuxtLink>
          <a href="#" @click.prevent="logout" class="nav-link">注销</a>
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
        <p class="footer-text">© 2026 汉王数字文件上传系统 · 智能科技 · 服务未来</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
const router = useRouter();

const logout = async () => {
  await fetch('/api/logout', { method: 'POST' });
  router.push('/login');
};
</script>

<style lang="scss" scoped>
@use '~/assets/styles/app.scss';
</style>
