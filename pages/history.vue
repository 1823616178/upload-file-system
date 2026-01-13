<template>
  <div class="history-page">
    <div class="history-container">
      <div class="header">
        <h1 class="title">汉王数字文件上传系统 - 历史记录</h1>
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
            @click="handleItemClick(item)"
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
              <div class="item-path" :title="getPreviewUrl(item.remotePath)">
                {{ getPreviewUrl(item.remotePath) }}
              </div>
              <div class="item-source" v-if="item.source">
                <span class="source-tag" :class="item.source">{{ item.source === 'ftp' ? 'FTP' : 'DB' }}</span>
              </div>
            </div>
            <div class="item-actions">
              <button @click.stop="previewImage(item)" class="action-btn preview-btn" title="预览">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button @click.stop="copyPath(item.remotePath)" class="action-btn copy-btn" title="复制链接">
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button @click.stop="deleteRecord(item.id, item.source, item.remotePath)" class="action-btn delete-btn" title="删除记录">
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

      <!-- 图片预览模态框 -->
      <div class="preview-modal" v-if="preview.show" @click.self="closePreview">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ preview.fileName }}</h3>
            <button @click="closePreview" class="close-btn">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="preview.loading" class="preview-loading">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else-if="preview.error" class="preview-error">
              <p>{{ preview.error }}</p>
            </div>
            <img 
              v-else 
              :src="preview.url" 
              :alt="preview.fileName" 
              class="preview-image" 
              @click="copyUrl(preview.url)"
              title="点击复制链接"
            />
          </div>
          <div class="modal-footer">
            <button @click="downloadImage" class="download-btn">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              下载文件
            </button>
          </div>
        </div>
      </div>

      <!-- 删除确认模态框 -->
      <div class="confirm-modal" v-if="deleteModal.show" @click.self="closeDeleteModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>确认删除</h3>
            <button @click="closeDeleteModal" class="close-btn">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <p class="confirm-text">确定要删除这条记录吗？此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button @click="closeDeleteModal" class="btn cancel-btn">取消</button>
            <button @click="executeDelete" class="btn delete-confirm-btn" :disabled="deleteModal.loading">
              {{ deleteModal.loading ? '删除中...' : '确定删除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { toast } from '~/utils/toast'

const historyList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

// 预览状态
const preview = ref({
  show: false,
  fileName: '',
  url: '',
  loading: false,
  error: null
})

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

// 点击文件项
const handleItemClick = (item) => {
  // 可以添加点击操作
  console.log('点击文件:', item)
}

// 获取预览 URL
const getPreviewUrl = (path) => {
  if (!path) return ''
  return `${window.location.origin}/api/ftp-image?path=${encodeURIComponent(path)}`
}

// 预览图片
const previewImage = (item) => {
  preview.value = {
    show: true,
    fileName: item.fileName,
    url: getPreviewUrl(item.remotePath),
    loading: false,
    error: null
  }
}

// 关闭预览
const closePreview = () => {
  preview.value = {
    show: false,
    fileName: '',
    url: '',
    loading: false,
    error: null
  }
}

// 下载图片
const downloadImage = () => {
  const url = preview.value.url
  if (!url) return

  const a = document.createElement('a')
  a.href = url
  a.download = preview.value.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 复制 URL
const copyUrl = async (url) => {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    toast.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    toast.error('复制失败，请手动复制')
  }
}

// 复制链接
const copyPath = async (path) => {
  try {
    const url = getPreviewUrl(path)
    await navigator.clipboard.writeText(url)
    toast.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    toast.error('复制失败，请手动复制')
  }
}

// 删除确认状态
const deleteModal = ref({
  show: false,
  id: null,
  source: null,
  remotePath: null,
  loading: false
})

// ... existing code ...

// 删除记录（点击删除按钮）
const deleteRecord = (id, source, remotePath) => {
  deleteModal.value = {
    show: true,
    id,
    source,
    remotePath,
    loading: false
  }
}

// 关闭删除模态框
const closeDeleteModal = () => {
  deleteModal.value = {
    show: false,
    id: null,
    source: null,
    remotePath: null,
    loading: false
  }
}

// 执行删除
const executeDelete = async () => {
  if (deleteModal.value.loading) return

  deleteModal.value.loading = true
  const { id, source, remotePath } = deleteModal.value

  try {
    const response = await $fetch('/api/history', {
      method: 'DELETE',
      body: {
        id: Math.floor(Number(id)), // 转换为整数
        source: source || 'database',
        remotePath: remotePath || ''
      }
    })

    if (response.success) {
      toast.success('删除成功')
      closeDeleteModal()
      closePreview() // 如果在预览中删除，也关闭预览

      // 从列表中移除该项
      historyList.value = historyList.value.filter(item => item.id !== id)
    } else {
      toast.error('删除失败: ' + (response.error || '未知错误'))
    }
  } catch (error) {
    console.error('删除失败:', error)
    toast.error('删除失败，请重试')
  } finally {
    deleteModal.value.loading = false
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped lang="scss">
@import '~/assets/styles/history.scss';

// 预览模态框样式
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  .modal-content {
    background: rgba(20, 20, 40, 0.95);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 16px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);

    h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      color: #00d4ff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 212, 255, 0.2);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  .modal-body {
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    max-height: 70vh;
    overflow: auto;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;

    .preview-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      color: #00d4ff;
    }

    .preview-error {
      color: #ff4757;
    }

    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s ease;

      &:active {
        transform: scale(0.98);
      }
    }
  }

  .modal-footer {
    padding: 20px;
    border-top: 1px solid rgba(0, 212, 255, 0.1);
    display: flex;
    justify-content: center;

    .download-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 212, 255, 0.4);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}

// 来源标签样式
.item-source {
  margin-top: 6px;

  .source-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);

    &.ftp {
      color: #00ff88;
      border-color: rgba(0, 255, 136, 0.3);
      background: rgba(0, 255, 136, 0.1);
    }

    &.db {
      color: #8892b0;
      border-color: rgba(136, 146, 176, 0.3);
      background: rgba(136, 146, 176, 0.1);
    }
  }
}

// 预览按钮样式
.preview-btn {
  background: rgba(0, 212, 255, 0.1) !important;
  border-color: rgba(0, 212, 255, 0.3) !important;

  &:hover {
    background: rgba(0, 212, 255, 0.2) !important;
  }
}

// 删除确认模态框样式
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001; // 高于预览模态框
  padding: 20px;

  .modal-content {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(255, 71, 87, 0.3); // 红色警告边框
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: modal-in 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 4px;
      transition: color 0.3s;

      &:hover {
        color: #fff;
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  .modal-body {
    padding: 30px 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);

    .warning-icon {
      color: #ff4757;
      margin-bottom: 15px;

      svg {
        width: 48px;
        height: 48px;
      }
    }

    .confirm-text {
      font-size: 16px;
      line-height: 1.5;
      margin: 0;
    }
  }

  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.3s ease;

      &.cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      &.delete-confirm-btn {
        background: rgba(255, 71, 87, 0.1);
        color: #ff4757;
        border-color: rgba(255, 71, 87, 0.5);

        &:hover {
          background: #ff4757;
          color: #fff;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

@keyframes modal-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
