<template>
  <div class="ftp-manager-page">
    <div class="ftp-container">
      <div class="header">
        <h1 class="title">FTP 文件管理</h1>
        <p class="subtitle" v-if="!isShowingSearchResults">浏览和管理 FTP 服务器上的文件</p>
        <p class="subtitle" v-else>搜索结果: "{{ searchQuery }}"</p>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="breadcrumb">
          <span class="breadcrumb-item" @click="navigateTo('/static')">
            <svg viewBox="0 0 24 24" class="home-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" fill="none"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </span>
          <template v-for="(segment, index) in pathSegments" :key="index">
            <span class="separator">/</span>
            <span 
              class="breadcrumb-item" 
              :class="{ active: index === pathSegments.length - 1 }"
              @click="navigateToSegment(index)"
            >
              {{ segment }}
            </span>
          </template>
        </div>
        <div class="actions">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              @keyup.enter="handleSearch"
              placeholder="搜索当前目录..."
              :disabled="loading && !searching"
            />
            <button class="search-btn" @click="handleAction" :title="searching ? '取消搜索' : '搜索'">
              <template v-if="!searching">
                <svg viewBox="0 0 24 24">
                  <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" class="cancel-icon">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </template>
            </button>
          </div>
          <button class="action-btn refresh-btn" @click="loadDirectory" :disabled="loading">
            <svg viewBox="0 0 24 24" :class="{ spinning: loading }">
              <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            刷新
          </button>
          <button class="action-btn back-btn" @click="goBack" :disabled="currentPath === '.' || loading">
            <svg viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            返回上级
          </button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list-container">
        <div class="file-list-header">
          <div class="col-name">名称</div>
          <div class="col-size">大小</div>
          <div class="col-time">修改时间</div>
          <div class="col-actions">操作</div>
        </div>

        <div class="file-list" v-if="!loading && files.length > 0">
          <div 
            v-for="file in files" 
            :key="file.name" 
            class="file-item"
            :class="{ 'is-directory': file.isDirectory }"
            @click="handleClick(file)"
            @dblclick="handleDoubleClick(file)"
          >
            <div class="col-name">
              <div class="file-icon">
                <svg v-if="file.isDirectory" viewBox="0 0 24 24">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <svg v-else-if="isImage(file.name)" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <span class="file-name" :title="file.name">{{ file.name }}</span>
            </div>
            <div class="col-size">{{ file.isDirectory ? '-' : file.sizeFormatted }}</div>
            <div class="col-time">{{ formatTime(file.modifyTime) }}</div>
            <div class="col-actions">
              <button 
                v-if="file.isDirectory"
                class="btn-icon open-btn" 
                @click.stop="navigateTo(file.fullPath)"
                title="打开文件夹"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M15 13l-3 3m0 0l-3-3m3 3V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                v-if="isImage(file.name) || isXml(file.name)" 
                class="btn-icon preview-btn" 
                @click.stop="previewFile(file)"
                title="预览"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button 
                v-if="!file.isDirectory"
                class="btn-icon download-btn" 
                @click.stop="downloadFile(file)"
                title="下载"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none"/>
                  <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" fill="none"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <button 
                class="btn-icon rename-btn" 
                @click.stop="openRenameModal(file)"
                title="重命名"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button 
                class="btn-icon delete-btn" 
                @click.stop="openDeleteModal(file)"
                title="删除"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" stroke-width="2" fill="none"/>
                  <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2"/>
                  <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else-if="!loading && files.length === 0">
          <svg viewBox="0 0 24 24" class="empty-icon">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <p v-if="isShowingSearchResults">未找到匹配的文件</p>
          <p v-else>该目录为空</p>
        </div>

        <!-- 加载状态 -->
        <div class="loading-state" v-if="loading">
          <GlobalLoader text="正在加载目录..." />
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="status-bar" v-if="!loading">
        <span>{{ files.filter(f => f.isDirectory).length }} 个文件夹</span>
        <span>{{ files.filter(f => !f.isDirectory).length }} 个文件</span>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div class="modal preview-modal" v-if="previewModal.show" @click.self="closePreviewModal">
      <div class="modal-content preview-content">
        <div class="modal-header">
          <h3>{{ previewModal.fileName }}</h3>
          <button @click="closePreviewModal" class="close-btn">
            <svg viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="previewModal.loading" class="preview-loading">
            <GlobalLoader text="正在加载文件..." />
          </div>
          <img v-else-if="previewModal.type === 'image'" :src="previewModal.url" :alt="previewModal.fileName" class="preview-image"/>
          <pre v-else-if="previewModal.type === 'xml'" class="xml-content"><code>{{ previewModal.content }}</code></pre>
        </div>
        <div class="modal-footer">
          <button @click="downloadFile(previewModal.file)" class="btn primary-btn">
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" fill="none"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            下载文件
          </button>
        </div>
      </div>
    </div>

    <!-- 重命名模态框 -->
    <div class="modal" v-if="renameModal.show" @click.self="closeRenameModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>重命名</h3>
          <button @click="closeRenameModal" class="close-btn">
            <svg viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label>新名称</label>
            <input 
              type="text" 
              v-model="renameModal.newName" 
              @keyup.enter="executeRename"
              ref="renameInputRef"
              placeholder="请输入新名称"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeRenameModal" class="btn cancel-btn">取消</button>
          <button @click="executeRename" class="btn primary-btn" :disabled="renameModal.loading">
            {{ renameModal.loading ? '处理中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal" v-if="deleteModal.show" @click.self="closeDeleteModal">
      <div class="modal-content danger">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="closeDeleteModal" class="close-btn">
            <svg viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <svg viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <p class="confirm-text">
            确定要删除 <strong>{{ deleteModal.fileName }}</strong> 吗？
            <template v-if="deleteModal.isDirectory">
              <br/><span class="danger-text">该目录下的所有文件也将被删除！</span>
            </template>
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn cancel-btn">取消</button>
          <button @click="executeDelete" class="btn danger-btn" :disabled="deleteModal.loading">
            {{ deleteModal.loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { toast } from '~/utils/toast'

const loading = ref(false)
const searching = ref(false)
const currentPath = ref('/static')  // 默认路径为 /static
const files = ref([])
const searchQuery = ref('')
const searchResults = ref([])
const isShowingSearchResults = ref(false)
let searchAbortController = null

// 路径分段
const pathSegments = computed(() => {
  if (currentPath.value === '.' || currentPath.value === '/') return []
  return currentPath.value.split('/').filter(Boolean)
})

// 加载目录
const loadDirectory = async () => {
  loading.value = true
  isShowingSearchResults.value = false
  try {
    const response = await $fetch('/api/ftp-directory', {
      query: { path: currentPath.value }
    })
    if (response.success) {
      // 调试日志
      console.log('FTP 返回的文件列表:', response.data.files)
      
      // 排序：文件夹在前，文件在后
      files.value = response.data.files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } else {
      toast.error(response.error || '加载目录失败')
    }
  } catch (error) {
    console.error('加载目录失败:', error)
    toast.error('加载目录失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索框动作（搜索或取消）
const handleAction = () => {
  if (searching.value) {
    cancelSearch()
  } else {
    handleSearch()
  }
}

// 取消搜索
const cancelSearch = () => {
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  searching.value = false
  loading.value = false
  toast.info('搜索已取消')
}

// 搜索文件
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    if (isShowingSearchResults.value) {
      // 如果清空搜索框且当前显示搜索结果，则重新加载当前目录
      loadDirectory()
    }
    return
  }
  
  // 取消之前的请求（如果有）
  if (searchAbortController) {
    searchAbortController.abort()
  }
  searchAbortController = new AbortController()

  loading.value = true
  searching.value = true
  isShowingSearchResults.value = true
  
  try {
    const response = await $fetch('/api/ftp-search', {
      query: { 
        q: searchQuery.value,
        path: currentPath.value
      },
      signal: searchAbortController.signal
    })
    
    if (response.success) {
      files.value = response.data
      if (response.data.length > 0) {
        toast.success(`找到 ${response.data.length} 个结果`)
      } else {
        toast.info('没有找到匹配的文件')
      }
    } else {
      // 搜索失败也视为没找到（或者后端返回了空）
      // toast.error(response.error || '搜索失败')
      console.warn('搜索返回非成功状态:', response.error)
      files.value = []
      // 保持显示搜索结果状态，这样界面会显示"未找到匹配的文件"
      isShowingSearchResults.value = true 
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('搜索请求被取消')
      return
    }
    console.error('搜索失败:', error)
    // 用户要求：不要显示搜索请求失败，要说没有找到
    // toast.error('搜索请求失败')
    
    files.value = []
    isShowingSearchResults.value = true
  } finally {
    // 只有当不是因为取消而结束时，才重置状态
    // 如果是取消，cancelSearch 已经处理了
    if (searchAbortController && !searchAbortController.signal.aborted) {
      loading.value = false
      searching.value = false
      searchAbortController = null
    }
  }
}

// 导航到指定路径
const navigateTo = (path) => {
  currentPath.value = path
  loadDirectory()
}

// 导航到面包屑某一级
const navigateToSegment = (index) => {
  const newPath = '/' + pathSegments.value.slice(0, index + 1).join('/')
  navigateTo(newPath)
}

// 返回上级目录
const goBack = () => {
  if (currentPath.value === '.' || currentPath.value === '/') return
  const segments = pathSegments.value
  segments.pop()
  const newPath = segments.length > 0 ? segments.join('/') : '.'
  navigateTo(newPath)
}

// 单击处理 - 文件夹直接进入
const handleClick = (file) => {
  if (file.isDirectory) {
    navigateTo(file.fullPath)
  }
}

// 双击处理
const handleDoubleClick = (file) => {
  if (file.isDirectory) {
    navigateTo(file.fullPath)
  } else if (isImage(file.name) || isXml(file.name)) {
    previewFile(file)
  }
}

// 判断是否为图片
const isImage = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

// 判断是否为XML文件
const isXml = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext === 'xml'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 预览模态框
const previewModal = ref({
  show: false,
  fileName: '',
  url: '',
  content: '',
  type: 'image', // 'image' or 'xml'
  loading: false,
  file: null
})

const previewFile = async (file) => {
  console.log('预览文件:', file.name, '路径:', file.fullPath)
  
  const fileType = isXml(file.name) ? 'xml' : 'image'
  
  previewModal.value = {
    show: true,
    fileName: file.name,
    url: '',
    content: '',
    type: fileType,
    loading: true,
    file
  }
  try {
    const response = await $fetch('/api/ftp-file', {
      query: { path: file.fullPath }
    })
    
    console.log('FTP 文件响应:', response)
    
    if (response.success) {
      if (fileType === 'xml' && response.data.base64) {
        // 正确解码 base64 为 UTF-8 文本
        const binaryString = atob(response.data.base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoder = new TextDecoder('utf-8')
        const xmlText = decoder.decode(bytes)
        previewModal.value.content = xmlText
      } else if (response.data.previewUrl) {
        previewModal.value.url = response.data.previewUrl
      } else {
        const errorMsg = response.error || '无法预览该文件'
        console.error('预览失败:', errorMsg)
        toast.error(errorMsg)
        previewModal.value.show = false
      }
    } else {
      const errorMsg = response.error || '无法预览该文件'
      console.error('预览失败:', errorMsg)
      toast.error(errorMsg)
      previewModal.value.show = false
    }
  } catch (error) {
    console.error('加载预览失败:', error)
    toast.error('加载预览失败: ' + (error.message || error))
    previewModal.value.show = false
  } finally {
    previewModal.value.loading = false
  }
}

const closePreviewModal = () => {
  previewModal.value.show = false
}

// 下载文件
const downloadFile = async (file) => {
  try {
    const response = await $fetch('/api/ftp-file', {
      query: { path: file.fullPath }
    })
    if (response.success && response.data.base64) {
      const link = document.createElement('a')
      link.href = response.data.previewUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('开始下载')
    } else {
      toast.error('下载失败')
    }
  } catch (error) {
    toast.error('下载失败')
  }
}

// 重命名模态框
const renameModal = ref({
  show: false,
  file: null,
  newName: '',
  loading: false
})
const renameInputRef = ref(null)

const openRenameModal = (file) => {
  renameModal.value = {
    show: true,
    file,
    newName: file.name,
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
  const { file, newName } = renameModal.value
  if (!newName.trim()) {
    toast.warning('请输入新名称')
    return
  }
  if (newName === file.name) {
    closeRenameModal()
    return
  }

  renameModal.value.loading = true
  try {
    const response = await $fetch('/api/ftp-rename', {
      method: 'POST',
      body: {
        oldPath: file.fullPath,
        newName: newName.trim()
      }
    })
    if (response.success) {
      toast.success('重命名成功')
      closeRenameModal()
      loadDirectory()
    } else {
      toast.error(response.error || '重命名失败')
    }
  } catch (error) {
    toast.error('重命名失败')
  } finally {
    renameModal.value.loading = false
  }
}

// 删除模态框
const deleteModal = ref({
  show: false,
  file: null,
  fileName: '',
  isDirectory: false,
  loading: false
})

const openDeleteModal = (file) => {
  deleteModal.value = {
    show: true,
    file,
    fileName: file.name,
    isDirectory: file.isDirectory,
    loading: false
  }
}

const closeDeleteModal = () => {
  deleteModal.value.show = false
}

const executeDelete = async () => {
  const { file } = deleteModal.value
  deleteModal.value.loading = true
  try {
    const response = await $fetch('/api/ftp-delete', {
      method: 'POST',
      body: {
        path: file.fullPath,
        isDirectory: file.isDirectory
      }
    })
    if (response.success) {
      toast.success('删除成功')
      closeDeleteModal()
      loadDirectory()
    } else {
      toast.error(response.error || '删除失败')
    }
  } catch (error) {
    toast.error('删除失败')
  } finally {
    deleteModal.value.loading = false
  }
}

onMounted(() => {
  loadDirectory()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/ftp-manager.scss';
</style>
