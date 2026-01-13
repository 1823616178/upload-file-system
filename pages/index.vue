<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-gradient">智能文件</span>
          <br/>
          <span class="title-highlight">传输平台</span>
        </h1>
        <p class="hero-subtitle">
          安全 · 高效 · 智能 · 可靠
        </p>
        <p class="hero-description">
          专为现代化文件传输需求打造的智能平台，采用先进的FTP协议，确保您的数据安全、快速地到达目的地
        </p>

        <div class="cta-buttons">
          <NuxtLink to="/uploadFile" class="cta-button primary">
            <svg viewBox="0 0 24 24" class="button-icon">
              <path d="M12 4V20M12 4L5 11M12 4L19 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <line x1="4" y1="21" x2="20" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            开始上传
          </NuxtLink>
          <button class="cta-button secondary" @click="learnMore">
            了解更多
          </button>
        </div>

        <!-- 特性卡片 -->
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M24 12V24L32 28" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
            </div>
            <h3 class="feature-title">极速传输</h3>
            <p class="feature-desc">优化传输协议，大幅提升文件上传速度</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 48 48">
                <rect x="8" y="20" width="32" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 20V14C12 9.58172 15.5817 6 20 6H28C32.4183 6 36 9.58172 36 14V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-title">安全可靠</h3>
            <p class="feature-desc">采用加密传输，保障数据安全不泄露</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 48 48">
                <path d="M24 8L40 16V32L24 40L8 32V16L24 8Z" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="24" cy="24" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 class="feature-title">智能管理</h3>
            <p class="feature-desc">自动分类整理，让文件管理更轻松</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 48 48">
                <path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M24 24L24 44M24 24L4 34M24 24L44 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-title">多端支持</h3>
            <p class="feature-desc">支持多种文件类型，满足各类需求</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const learnMore = () => {
  // 可以添加了解更多功能，如弹出模态框等
  console.log('了解更多')
}
</script>

<style scoped>
@import '~/assets/styles/home.scss';
</style>
