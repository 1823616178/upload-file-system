<template>
  <div class="home-page">
    <TechParticles />
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>FTP 连接池复用 · 流式传输 · Open API v1</span>
        </div>

        <h1 class="hero-title">
          <span class="title-gradient">汉王数字</span>
          <br />
          <span class="title-highlight">文件上传系统</span>
        </h1>

        <p class="hero-subtitle">安全 · 高效 · 智能 · 可靠</p>
        <p class="hero-description">
          专为现代化文件传输与资产管理需求打造的智能平台，基于 FTP 连接池与流式传输架构，确保您的数据安全、快速地到达目的地
        </p>

        <div class="cta-buttons">
          <NuxtLink to="/uploadFile" class="cta-button primary">
            <svg viewBox="0 0 24 24" class="button-icon" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4V16M12 4L7 9M12 4L17 9" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" />
            </svg>
            开始上传
          </NuxtLink>
          <NuxtLink to="/ftp-manager" class="cta-button outline">
            <svg viewBox="0 0 24 24" class="button-icon" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            FTP 管理
          </NuxtLink>
          <button type="button" class="cta-button secondary" @click="openInfoModal">
            <svg viewBox="0 0 24 24" class="button-icon" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            了解更多
          </button>
        </div>

        <!-- 特性卡片 -->
        <div class="features-grid">
          <NuxtLink
            v-for="(feature, index) in features"
            :key="feature.title"
            :to="feature.to"
            class="feature-card"
            :style="{ '--stagger-index': index }"
            @mousemove="handleCardMouseMove"
          >
            <div class="feature-icon" v-html="feature.icon"></div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-desc">{{ feature.desc }}</p>
            <span class="feature-link-hint">{{ feature.hint }} →</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 系统架构与 Open API 说明弹窗 -->
    <Transition name="modal-fade">
      <div v-if="showInfoModal" class="info-modal-backdrop" @click.self="closeInfoModal">
        <div class="modal-content info-modal-card" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
          <div class="info-modal-header">
            <div>
              <h2 id="info-modal-title">系统能力与对外接口指南</h2>
              <p class="info-modal-subtitle">平台技术架构、上传规范与 Open API v1 快速接入</p>
            </div>
            <button type="button" class="info-close-btn" @click="closeInfoModal" aria-label="关闭弹窗">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="info-tabs">
            <button
              type="button"
              class="info-tab"
              :class="{ active: activeTab === 'overview' }"
              @click="activeTab = 'overview'"
            >
              系统架构与规范
            </button>
            <button
              type="button"
              class="info-tab"
              :class="{ active: activeTab === 'openapi' }"
              @click="activeTab = 'openapi'"
            >
              对外接口 (/api/v1)
            </button>
          </div>

          <div class="info-modal-body">
            <div v-if="activeTab === 'overview'" class="info-panel">
              <div class="spec-grid">
                <div class="spec-item">
                  <h4>单文件上限</h4>
                  <p>100 MB（支持实时进度监控与多文件队列）</p>
                </div>
                <div class="spec-item">
                  <h4>支持文件格式</h4>
                  <p>图片（JPG/PNG/GIF/WebP/BMP/SVG）、文档（PDF/Office/TXT/XML/JSON）、压缩包（ZIP/RAR/7z）、字体（TTF/OTF/WOFF/WOFF2）</p>
                </div>
                <div class="spec-item">
                  <h4>传输与缓存优化</h4>
                  <p>FTP 长连接池复用（带排队超时保护）、大文件流式下载（低内存占用）、图片缩略图 LRU 缓存</p>
                </div>
                <div class="spec-item">
                  <h4>安全防线</h4>
                  <p>目录越界路径规范化防护、HttpOnly 会话鉴权、登录防爆破限流、SVG 沙箱防 XSS</p>
                </div>
              </div>
            </div>

            <div v-else class="info-panel">
              <div class="api-auth-tip">
                <strong>鉴权方式：</strong>在环境变量配置 <code>NUXT_API_KEYS</code> 后，请求头携带
                <code>X-API-Key: &lt;your-key&gt;</code> 或 <code>Authorization: Bearer &lt;your-key&gt;</code>。
              </div>

              <div class="api-endpoints-list">
                <div class="api-row" v-for="ep in apiEndpoints" :key="ep.path + ep.method">
                  <span class="api-method" :class="ep.method.toLowerCase()">{{ ep.method }}</span>
                  <code class="api-path">{{ ep.path }}</code>
                  <span class="api-desc">{{ ep.desc }}</span>
                </div>
              </div>

              <div class="curl-example-box">
                <div class="curl-header">
                  <span>快速调用示例（cURL）</span>
                  <button type="button" class="copy-curl-btn" @click="copyCurlExample">复制命令</button>
                </div>
                <pre><code>{{ curlExample }}</code></pre>
              </div>
            </div>
          </div>

          <div class="info-modal-footer">
            <a href="/api/v1/openapi.json" target="_blank" rel="noopener" class="info-btn ghost">
              查看 OpenAPI JSON 规范
            </a>
            <NuxtLink to="/uploadFile" class="info-btn primary" @click="closeInfoModal">
              立即开始上传
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { toast } from '~/utils/toast'
import { copyToClipboard } from '~/utils/clipboard'

const showInfoModal = ref(false)
const activeTab = ref('overview')

const features = [
  {
    title: '极速传输',
    desc: 'FTP 连接池复用与流式传输架构，大幅提升文件上传与下载响应速度',
    hint: '进入上传中心',
    to: '/uploadFile',
    icon: `<svg viewBox="0 0 48 48" width="42" height="42" fill="none">
      <circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="2" />
      <path d="M24 13V24L32 28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`
  },
  {
    title: '安全可靠',
    desc: '目录路径沙箱校验、登录限流、SVG CSP 隔离与 API Key 常数时间验签',
    hint: '查看系统规范',
    to: '/history',
    icon: `<svg viewBox="0 0 48 48" width="42" height="42" fill="none">
      <rect x="9" y="21" width="30" height="19" rx="3" stroke="currentColor" stroke-width="2" />
      <path d="M15 21V15C15 10.03 19.03 6 24 6C28.97 6 33 10.03 33 15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <circle cx="24" cy="30" r="2.5" fill="currentColor" />
    </svg>`
  },
  {
    title: '智能管理',
    desc: '支持文件分类检索、实时缩略图缓存、多格式在线预览与历史追溯',
    hint: '查看历史记录',
    to: '/history',
    icon: `<svg viewBox="0 0 48 48" width="42" height="42" fill="none">
      <path d="M24 7L39 15.5V32.5L24 41L9 32.5V15.5L24 7Z" stroke="currentColor" stroke-width="2" />
      <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>`
  },
  {
    title: '远程目录浏览',
    desc: '可视化目录树浏览、拖拽上传、重命名与批量管理，兼顾桌面与移动端',
    hint: '打开 FTP 管理',
    to: '/ftp-manager',
    icon: `<svg viewBox="0 0 48 48" width="42" height="42" fill="none">
      <path d="M24 5L42 14V34L24 43L6 34V14L24 5Z" stroke="currentColor" stroke-width="2" />
      <path d="M24 24V43M24 24L6 14M24 24L42 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>`
  }
]

const apiEndpoints = [
  { method: 'GET', path: '/api/v1/health', desc: '服务与依赖健康探针（?deep=true）' },
  { method: 'POST', path: '/api/v1/files/upload', desc: '上传文件到指定目录并记录历史' },
  { method: 'GET', path: '/api/v1/files', desc: '分页列出 FTP 目录与搜索过滤' },
  { method: 'GET', path: '/api/v1/files/info', desc: '查询单个文件或目录元信息' },
  { method: 'GET', path: '/api/v1/files/download', desc: '流式下载或在线预览（?inline=true）' },
  { method: 'GET', path: '/api/v1/files/thumbnail', desc: '获取缓存后的图片缩略图' },
  { method: 'POST', path: '/api/v1/files/mkdir', desc: '创建多级目录' },
  { method: 'PATCH', path: '/api/v1/files/rename', desc: '重命名文件/目录并同步数据库' },
  { method: 'DELETE', path: '/api/v1/files', desc: '删除文件或目录' },
  { method: 'GET', path: '/api/v1/history', desc: '多条件查询上传历史记录' }
]

const curlExample = `curl -X POST "http://localhost:3000/api/v1/files/upload" \\
  -H "X-API-Key: your-api-key" \\
  -F "file=@./sample.png" \\
  -F "dir=docs/2026"`

const openInfoModal = () => {
  showInfoModal.value = true
}

const closeInfoModal = () => {
  showInfoModal.value = false
}

const copyCurlExample = async () => {
  const ok = await copyToClipboard(curlExample)
  if (ok) {
    toast.success('示例命令已复制到剪贴板')
  } else {
    toast.error('复制失败，请手动复制')
  }
}

const handleCardMouseMove = (event) => {
  const card = event.currentTarget
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
  card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && showInfoModal.value) {
    closeInfoModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/home.scss';
</style>
