<template>
  <div class="history-page">
    <div class="history-container">
      <div class="header">
        <h1 class="title">上传历史记录</h1>
        <p class="subtitle">查看并检索上传记录 · 支持在线预览、下载、重命名与清理</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <svg viewBox="0 0 24 24" class="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="搜索文件名..."
            class="search-input"
          />
          <button v-if="searchQuery" type="button" class="clear-search-btn" @click="clearSearch" aria-label="清空搜索">
            ×
          </button>
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <div class="filter-group">
          <label class="filter-label">文件类型</label>
          <select v-model="filters.fileCategory" @change="handleFilterChange" class="filter-select">
            <option value="all">全部类型</option>
            <option value="image">图片</option>
            <option value="document">文档</option>
            <option value="archive">压缩包</option>
            <option value="font">字体</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">来源</label>
          <select v-model="filters.source" @change="handleFilterChange" class="filter-select">
            <option value="all">全部来源</option>
            <option value="database">系统上传</option>
            <option value="ftp">FTP</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">开始日期</label>
          <input type="date" v-model="filters.startDate" @change="handleFilterChange" class="filter-date-input" />
        </div>
        <div class="filter-group">
          <label class="filter-label">结束日期</label>
          <input type="date" v-model="filters.endDate" @change="handleFilterChange" class="filter-date-input" />
        </div>
        <button v-if="hasActiveFilters" type="button" @click="resetFilters" class="filter-reset-btn">
          重置筛选
        </button>
      </div>

      <!-- 骨架屏 -->
      <div class="skeleton-list" v-if="loading">
        <div v-for="n in 6" :key="n" class="skeleton-item">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-meta">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
            <div class="skeleton-path"></div>
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-list" v-else-if="historyList.length > 0">
        <TransitionGroup name="history-row" tag="div" class="history-items">
          <div
            v-for="item in historyList"
            :key="item.id"
            class="history-item"
            :class="{ previewable: isPreviewable(item.fileName) }"
            @click="handleItemClick(item)"
          >
            <div class="item-icon">
              <template v-if="isImage(item.fileName)">
                <img
                  :src="getThumbnailUrl(item.remotePath)"
                  :alt="item.fileName"
                  class="thumbnail-img"
                  loading="lazy"
                  @error="onThumbError"
                />
                <div class="thumbnail-fallback" style="display: none">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                      stroke="#00d4ff"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="#00d4ff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </template>
            </div>

            <div class="item-info">
              <h4 class="item-name clickable" @click.stop="copyFileName(item.fileName)" title="点击复制文件名">
                {{ item.fileName }}
              </h4>
              <div class="item-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 16 16" class="meta-icon">
                    <path
                      d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"
                      fill="currentColor"
                    />
                  </svg>
                  {{ item.fileSizeFormatted }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 16 16" class="meta-icon">
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4" />
                    <path d="M8 5v3.5l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
                  </svg>
                  {{ formatDateTime(item.uploadTime) }}
                </span>
                <span
                  class="meta-item"
                  v-if="item.ipAddress && item.ipAddress !== '-'"
                  :title="locations[item.ipAddress] || ''"
                >
                  <svg viewBox="0 0 24 24" class="meta-icon">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="currentColor"
                    />
                  </svg>
                  {{ item.ipAddress }}
                  <span class="location-text" v-if="locations[item.ipAddress]">({{ locations[item.ipAddress] }})</span>
                </span>
              </div>
              <div class="item-path-row">
                <span class="item-source" v-if="item.source">
                  <span class="source-tag" :class="item.source">{{ item.source === 'ftp' ? 'FTP' : 'DB' }}</span>
                </span>
                <span class="item-path" :title="item.remotePath">{{ getFileNameFromPath(item.remotePath) }}</span>
              </div>
            </div>

            <div class="item-actions">
              <button
                v-if="isPreviewable(item.fileName)"
                type="button"
                @click.stop="openPreview(item)"
                class="action-btn preview-btn"
                title="在线预览"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                type="button"
                @click.stop="downloadItem(item)"
                class="action-btn download-btn"
                title="下载文件"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button
                type="button"
                @click.stop="copyPath(item.remotePath)"
                class="action-btn copy-btn"
                title="复制访问链接"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke-linecap="round" />
                </svg>
              </button>
              <button
                type="button"
                @click.stop="openRenameModal(item)"
                class="action-btn rename-btn"
                title="重命名"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                @click.stop="deleteRecord(item.id, item.source, item.remotePath)"
                class="action-btn delete-btn"
                title="删除记录与文件"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6M10 11V17M14 11V17" />
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- 分页 -->
        <div class="pagination" v-if="totalCount > 0">
          <button
            type="button"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            上一页
          </button>
          <div class="pagination-info">
            共 {{ totalCount }} 条 · 第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <button
            type="button"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <svg viewBox="0 0 64 64" class="empty-icon">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" fill="none" />
          <path d="M20 32H44M32 20V44" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p class="empty-text">暂无符合条件的上传记录</p>
        <NuxtLink to="/uploadFile" class="upload-link">去上传文件</NuxtLink>
      </div>

      <!-- 多格式预览模态框 -->
      <Transition name="modal-fade">
        <div class="preview-modal" v-if="preview.show" @click.self="closePreview">
          <div class="modal-content" @click.stop role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>{{ preview.fileName }}</h3>
              <button type="button" @click="closePreview" class="close-btn" aria-label="关闭预览">
                <svg viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="preview.loading" class="preview-loading">
                <GlobalLoader text="正在加载预览..." />
              </div>
              <div v-else-if="preview.error" class="preview-error">
                <p>{{ preview.error }}</p>
              </div>
              <img
                v-else-if="preview.type === 'image'"
                :src="preview.url"
                :alt="preview.fileName"
                class="preview-image"
                @click="copyUrl(preview.url)"
                @error="preview.error = '图片加载失败或文件不存在'"
                title="点击复制链接"
              />
              <pre v-else-if="preview.type === 'text'" class="text-preview"><code>{{ preview.textContent }}</code></pre>
              <iframe v-else-if="preview.type === 'pdf'" :src="preview.url" class="preview-pdf" title="PDF 预览"></iframe>
            </div>
            <div class="modal-footer">
              <button
                v-if="preview.type === 'text' && preview.textContent"
                type="button"
                @click="copyUrl(preview.textContent)"
                class="secondary-modal-btn"
              >
                复制文本内容
              </button>
              <button type="button" @click="downloadPreviewFile" class="download-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                下载文件
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 删除确认模态框 -->
      <Transition name="modal-fade">
        <div class="confirm-modal" v-if="deleteModal.show" @click.self="closeDeleteModal">
          <div class="modal-content" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>确认删除</h3>
              <button type="button" @click="closeDeleteModal" class="close-btn" aria-label="关闭">
                <svg viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p class="confirm-text">确定要删除这条记录及对应远程文件吗？此操作无法撤销。</p>
            </div>
            <div class="modal-footer">
              <button type="button" @click="closeDeleteModal" class="btn cancel-btn">取消</button>
              <button type="button" @click="executeDelete" class="btn delete-confirm-btn" :disabled="deleteModal.loading">
                {{ deleteModal.loading ? '删除中...' : '确定删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 重命名模态框 -->
      <Transition name="modal-fade">
        <div class="confirm-modal rename-modal-variant" v-if="renameModal.show" @click.self="closeRenameModal">
          <div class="modal-content" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>重命名文件</h3>
              <button type="button" @click="closeRenameModal" class="close-btn" aria-label="关闭">
                <svg viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="input-group">
                <input
                  type="text"
                  v-model="renameModal.newName"
                  class="rename-input"
                  placeholder="请输入新文件名"
                  @keyup.enter="executeRename"
                  ref="renameInputRef"
                />
                <p class="input-hint">不需要包含文件后缀，系统会自动保留原扩展名</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" @click="closeRenameModal" class="btn cancel-btn">取消</button>
              <button type="button" @click="executeRename" class="btn confirm-btn" :disabled="renameModal.loading">
                {{ renameModal.loading ? '处理中...' : '确认修改' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { toast } from '~/utils/toast'
import { isImageFile, isTextFile, isPdfFile, isPreviewableFile } from '~/utils/fileTypes'
import {
  formatDateTime,
  getFileNameFromPath,
  getPreviewUrl,
  getThumbnailUrl,
  getDownloadUrl
} from '~/utils/format'
import { copyToClipboard } from '~/utils/clipboard'
import { decodeBase64Utf8, handleUnauthorized } from '~/utils/http'

const historyList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const pageSize = 10
const locations = ref({})

const filters = ref({
  fileCategory: 'all',
  source: 'all',
  startDate: '',
  endDate: ''
})

const hasActiveFilters = computed(() =>
  filters.value.fileCategory !== 'all' ||
  filters.value.source !== 'all' ||
  filters.value.startDate !== '' ||
  filters.value.endDate !== '' ||
  searchQuery.value !== ''
)

const isImage = isImageFile
const isPreviewable = isPreviewableFile

const handleFilterChange = () => {
  currentPage.value = 1
  loadHistory()
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    fileCategory: 'all',
    source: 'all',
    startDate: '',
    endDate: ''
  }
  currentPage.value = 1
  loadHistory()
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  loadHistory()
}

const onThumbError = (event) => {
  const img = event?.target
  if (!img) return
  img.style.display = 'none'
  if (img.nextElementSibling) {
    img.nextElementSibling.style.display = 'flex'
  }
}

const resolveIpLocations = (list) => {
  const ips = [...new Set(list.map(item => item.ipAddress).filter(ip => ip && ip !== '-'))]
  for (const ip of ips) {
    if (ip.startsWith('192.168.') || ip.startsWith('127.') || ip.startsWith('10.') || ip === '::1') {
      locations.value[ip] = '内网IP'
    } else {
      locations.value[ip] = '外网IP'
    }
  }
}

const loadHistory = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/history', {
      query: {
        page: currentPage.value,
        pageSize,
        search: searchQuery.value,
        fileCategory: filters.value.fileCategory,
        source: filters.value.source,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })

    if (response.success) {
      historyList.value = response.data
      totalPages.value = Math.max(1, response.pagination.totalPages || 1)
      totalCount.value = response.pagination.total || 0
      resolveIpLocations(historyList.value)
    } else {
      toast.error(response.error || '加载历史记录失败')
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      console.error('加载历史记录失败:', error)
      toast.error('加载历史记录失败')
    }
  } finally {
    loading.value = false
  }
}

let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadHistory()
  }, 300)
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadHistory()
  }
}

const handleItemClick = (item) => {
  if (isPreviewable(item.fileName)) {
    openPreview(item)
  } else {
    copyPath(item.remotePath)
  }
}

// 预览状态
const preview = ref({
  show: false,
  fileName: '',
  remotePath: '',
  url: '',
  type: 'image', // image | pdf | text
  textContent: '',
  loading: false,
  error: null
})

const openPreview = async (item) => {
  const type = isTextFile(item.fileName) ? 'text' : (isPdfFile(item.fileName) ? 'pdf' : 'image')
  const fileName = getFileNameFromPath(item.remotePath || item.fileName)

  preview.value = {
    show: true,
    fileName: item.fileName,
    remotePath: item.remotePath,
    url: type !== 'text' ? getPreviewUrl(item.remotePath) : '',
    type,
    textContent: '',
    loading: type === 'text',
    error: null
  }

  if (type !== 'text') return

  try {
    const response = await $fetch('/api/ftp-file', {
      query: { path: fileName }
    })

    if (response.success && response.data?.base64) {
      preview.value.textContent = decodeBase64Utf8(response.data.base64)
    } else {
      preview.value.error = response.error || '无法加载文件预览'
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      preview.value.error = error.message || '加载预览失败'
    }
  } finally {
    preview.value.loading = false
  }
}

const closePreview = () => {
  preview.value.show = false
}

const downloadItem = (item) => {
  const url = getDownloadUrl(item.remotePath)
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = item.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const downloadPreviewFile = () => {
  if (!preview.value.remotePath) return
  downloadItem({ remotePath: preview.value.remotePath, fileName: preview.value.fileName })
}

const copyUrl = async (text) => {
  if (!text) return
  const success = await copyToClipboard(text)
  if (success) {
    toast.success('已复制到剪贴板')
  } else {
    toast.error('复制失败，请手动复制')
  }
}

const copyFileName = async (fileName) => {
  if (!fileName) return
  const success = await copyToClipboard(fileName)
  if (success) {
    toast.success('文件名已复制到剪贴板')
  } else {
    toast.error('复制失败，请手动复制')
  }
}

const copyPath = async (remotePath) => {
  const url = getPreviewUrl(remotePath)
  const success = await copyToClipboard(url)
  if (success) {
    toast.success('访问链接已复制到剪贴板')
  } else {
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

const deleteRecord = (id, source, remotePath) => {
  deleteModal.value = {
    show: true,
    id,
    source,
    remotePath,
    loading: false
  }
}

const closeDeleteModal = () => {
  deleteModal.value.show = false
}

const executeDelete = async () => {
  if (deleteModal.value.loading) return

  deleteModal.value.loading = true
  const { id, source, remotePath } = deleteModal.value

  try {
    const response = await $fetch('/api/history', {
      method: 'DELETE',
      body: {
        id: String(id),
        source: source || 'database',
        remotePath: remotePath || ''
      }
    })

    if (response.success) {
      toast.success('删除成功')
      closeDeleteModal()
      closePreview()
      if (historyList.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      await loadHistory()
    } else {
      toast.error('删除失败: ' + (response.error || '未知错误'))
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  } finally {
    deleteModal.value.loading = false
  }
}

// 重命名状态
const renameModal = ref({
  show: false,
  id: null,
  source: null,
  remotePath: null,
  oldName: '',
  newName: '',
  loading: false
})
const renameInputRef = ref(null)

const openRenameModal = (item) => {
  const dotIdx = item.fileName.lastIndexOf('.')
  const nameWithoutExt = dotIdx > 0 ? item.fileName.substring(0, dotIdx) : item.fileName
  renameModal.value = {
    show: true,
    id: item.id,
    source: item.source,
    remotePath: item.remotePath,
    oldName: item.fileName,
    newName: nameWithoutExt,
    loading: false
  }
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

const closeRenameModal = () => {
  renameModal.value.show = false
}

const executeRename = async () => {
  if (!renameModal.value.newName.trim()) {
    toast.warning('请输入新文件名')
    return
  }
  if (renameModal.value.loading) return

  renameModal.value.loading = true
  const { id, oldName, newName, source, remotePath } = renameModal.value

  try {
    const response = await $fetch('/api/rename', {
      method: 'POST',
      body: {
        id: String(id),
        oldName,
        newName: newName.trim(),
        source,
        remotePath
      }
    })

    if (response.success) {
      toast.success('重命名成功')
      closeRenameModal()

      const index = historyList.value.findIndex(item => String(item.id) === String(id))
      if (index !== -1) {
        historyList.value[index].fileName = response.newName
        if (response.newRemotePath) {
          historyList.value[index].remotePath = response.newRemotePath
        }
      }
    } else {
      toast.error(response.error || '重命名失败')
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      console.error('重命名失败:', error)
      toast.error('重命名请求失败')
    }
  } finally {
    renameModal.value.loading = false
  }
}

const handleKeydown = (e) => {
  if (e.key !== 'Escape') return
  if (deleteModal.value.show) {
    closeDeleteModal()
  } else if (renameModal.value.show) {
    closeRenameModal()
  } else if (preview.value.show) {
    closePreview()
  }
}

onMounted(() => {
  loadHistory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/history.scss';
</style>
