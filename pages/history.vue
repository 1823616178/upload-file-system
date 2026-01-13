<template>
  <div class="history-page">
    <div class="history-container">
      <div class="header">
        <h1 class="title">上传历史记录</h1>
        <p class="subtitle">查看您的文件上传记录 · 管理已上传文件</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <svg viewBox="0 0 24 24" class="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="搜索文件名..."
            class="search-input"
          />
        </div>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-list" v-if="historyList.length > 0">
        <div class="history-items">
          <div
            v-for="item in historyList"
            :key="item.id"
            class="history-item"
          >
            <div class="item-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ item.fileName }}</h4>
              <div class="item-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 16 16" class="meta-icon">
                    <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm.5-8H7v6h1.5v-2h1.5l1 2H13l-1.2-2.3c.7-.3 1.2-1 1.2-1.9 0-1.2-.9-2.1-2.1-2.1z" fill="currentColor"/>
                  </svg>
                  {{ item.fileSizeFormatted }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 16 16" class="meta-icon">
                    <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 11c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="currentColor"/>
                    <circle cx="8" cy="5" r="1" fill="currentColor"/>
                    <path d="M8 7v5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                  </svg>
                  {{ formatDate(item.uploadTime) }}
                </span>
              </div>
              <div class="item-path" :title="item.remotePath">
                {{ item.remotePath }}
              </div>
            </div>
            <div class="item-actions">
              <button @click="copyPath(item.remotePath)" class="action-btn copy-btn" title="复制路径">
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button @click="deleteRecord(item.id)" class="action-btn delete-btn" title="删除记录">
                <svg viewBox="0 0 24 24">
                  <path d="M3 6H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6M10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            上一页
          </button>
          <div class="pagination-info">
            第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <svg viewBox="0 0 64 64" class="empty-icon">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M20 32H44M32 20V44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="empty-text">暂无上传记录</p>
        <NuxtLink to="/uploadFile" class="upload-link">去上传文件</NuxtLink>
      </div>

      <!-- 加载状态 -->
      <div class="loading" v-if="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const historyList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 加载历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/history', {
      query: {
        page: currentPage.value,
        pageSize: pageSize,
        search: searchQuery.value
      }
    })

    if (response.success) {
      historyList.value = response.data
      totalPages.value = response.pagination.totalPages
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理（带防抖）
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadHistory()
  }, 300)
}

// 分页切换
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadHistory()
  }
}

// 复制路径
const copyPath = async (path) => {
  try {
    await navigator.clipboard.writeText(path)
    alert('路径已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  }
}

// 删除记录
const deleteRecord = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) {
    return
  }

  try {
    const response = await $fetch('/api/history', {
      method: 'DELETE',
      body: { id }
    })

    if (response.success) {
      alert('删除成功')
      loadHistory()
    } else {
      alert('删除失败: ' + (response.error || '未知错误'))
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
@import '~/assets/styles/history.scss';
</style>
