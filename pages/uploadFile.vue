<template>
  <div class="upload-page">
    <div class="upload-container">
      <div class="header">
        <h1 class="title">汉王数字文件上传系统</h1>
        <p class="subtitle">安全传输 · 高效管理 · 智能存储 · 仅支持图片格式 · 最大100MB</p>
      </div>

      <div
        class="upload-zone"
        :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          @change="handleFileSelect"
          class="file-input"
        />

        <div class="upload-icon">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0099ff;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="none" stroke="url(#grad1)" stroke-width="2" />
            <path d="M32 18 L32 46 M32 18 L24 28 M32 18 L40 28" stroke="url(#grad1)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <line x1="20" y1="50" x2="44" y2="50" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="upload-text" v-if="!isUploading">
          <p class="primary-text">拖拽文件到此处或点击上传</p>
          <p class="secondary-text">支持多文件上传 · 图片格式 · 最大100MB</p>
        </div>

        <div class="uploading-text" v-else>
          <p class="primary-text">正在上传...</p>
          <p class="secondary-text">{{ uploadProgress }}%</p>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-bar" v-if="fileList.length > 0">
        <button 
          @click="startUpload" 
          class="start-upload-btn" 
          :disabled="isUploading || !hasPendingFiles"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {{ isUploading ? '上传中...' : '开始上传' }}
        </button>
      </div>

      <div class="file-list" v-if="fileList.length > 0">
        <div class="file-list-header">
          <h3 class="file-list-title">文件列表</h3>
          <NuxtLink to="/history" class="view-history-btn">查看历史记录</NuxtLink>
        </div>
        <div class="file-items">
          <div
            v-for="(file, index) in fileList"
            :key="index"
            class="file-item"
          >
            <div class="file-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-info">
              <p class="file-name" :title="file.name">{{ file.name }}</p>
              <p class="file-size">{{ formatFileSize(file.size) }}</p>
              <p class="file-path" v-if="file.remotePath" :title="getPreviewUrl(file.remotePath)">
                {{ getPreviewUrl(file.remotePath) }}
              </p>
              <p class="error-msg" v-if="file.status === 'error' && file.errorMsg">{{ file.errorMsg }}</p>
            </div>
            <div class="file-status" :class="file.status">
              {{ getStatusText(file.status) }}
            </div>
            
            <!-- 操作按钮 -->
            <div class="file-actions">
              <button
                v-if="file.status === 'success' && file.remotePath"
                @click="copyPath(file.remotePath)"
                class="icon-btn copy-path-btn"
                title="复制链接"
              >
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
              <button 
                v-if="file.status === 'pending' || file.status === 'error'"
                @click="removeFile(index)"
                class="icon-btn remove-btn"
                title="移除文件"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="status-message" :class="messageClass" v-if="message">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { toast } from '~/utils/toast'

const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileList = ref([]) // Renamed from uploadedFiles
const message = ref('')
const messageClass = ref('')
const targetFolder = ref('')

// 计算是否有待上传的文件
const hasPendingFiles = computed(() => {
  return fileList.value.some(f => f.status === 'pending' || f.status === 'error')
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleDragOver = (e) => {
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  isDragOver.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    addFiles(files)
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    addFiles(files)
  }
  e.target.value = ''
}

// 添加文件到列表
const addFiles = (files) => {
  const fileArray = Array.from(files)
  const newFiles = []
  
  for (const file of fileArray) {
    // 客户端验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.warning(`文件 ${file.name} 格式不支持`)
      continue
    }

    // 客户端验证文件大小
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast.warning(`文件 ${file.name} 超过 100MB`)
      continue
    }

    // 准备新文件对象
    newFiles.push({
      fileObject: file,
      name: file.name,
      size: file.size,
      status: 'pending'
    })
  }

  // 将新文件添加到列表顶部（倒序显示）
  fileList.value = [...newFiles, ...fileList.value]
}

// 移除文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

// 开始上传
const startUpload = async () => {
  const pendingFiles = fileList.value.filter(f => f.status === 'pending' || f.status === 'error')
  
  if (pendingFiles.length === 0) {
    toast.info('没有待上传的文件')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  message.value = ''

  // 确定远程路径
  const basePath = '/static/wenjinyangyi'
  let remotePath = basePath
  if (targetFolder.value && targetFolder.value.trim()) {
    const subFolder = targetFolder.value.trim().replace(/^\/+|\/+$/g, '')
    if (subFolder) {
      remotePath = `${basePath}/${subFolder}`
    }
  }

  let successCount = 0
  let totalProcessed = 0
  const totalToUpload = pendingFiles.length

  // 遍历列表上传
  for (let i = 0; i < fileList.value.length; i++) {
    const fileItem = fileList.value[i]
    
    // 只处理待上传或失败的文件
    if (fileItem.status !== 'pending' && fileItem.status !== 'error') continue
    
    fileItem.status = 'uploading'

    try {
      const formData = new FormData()
      formData.append('file', fileItem.fileObject)
      formData.append('remotePath', remotePath)

      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        fileItem.status = 'success'
        fileItem.remotePath = response.remotePath
        successCount++
      } else {
        fileItem.status = 'error'
        fileItem.errorMsg = response.error
      }
    } catch (error) {
      fileItem.status = 'error'
      fileItem.errorMsg = '请求失败'
      console.error('上传失败:', error)
    }

    totalProcessed++
    uploadProgress.value = Math.round((totalProcessed / totalToUpload) * 100)
  }

  isUploading.value = false

  if (successCount === totalToUpload) {
    toast.success(`成功上传 ${successCount} 个文件`)
  } else if (successCount > 0) {
    toast.warning(`完成上传，成功 ${successCount} 个，失败 ${totalToUpload - successCount} 个`)
  } else {
    toast.error('上传失败，请重试')
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待上传',
    uploading: '上传中...',
    success: '上传成功',
    error: '上传失败'
  }
  return statusMap[status] || status
}

// 获取预览 URL
const getPreviewUrl = (path) => {
  if (!path) return ''
  return `${window.location.origin}/api/ftp-image?path=${encodeURIComponent(path)}`
}

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
</script>

<style scoped lang="scss">
@import '~/assets/styles/upload.scss';

// 文件夹输入框样式
.folder-input-group {
  margin-bottom: 24px;
  
  .folder-label {
    display: block;
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .folder-icon {
    position: absolute;
    left: 14px;
    width: 20px;
    height: 20px;
    color: #00d4ff;
    pointer-events: none;
  }

  .folder-input {
    width: 100%;
    padding: 12px 15px 12px 45px;
    background: rgba(10, 10, 26, 0.4);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    color: #ffffff;
    font-size: 15px;
    outline: none;
    transition: all 0.3s ease;

    &:focus {
      border-color: #00d4ff;
      background: rgba(10, 10, 26, 0.6);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

// 开始上传按钮
.action-bar {
  margin-top: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.start-upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #4a5568;
    box-shadow: none;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.file-status {
  &.pending {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
}

// 文件列表操作按钮
.file-actions {
  display: flex;
  gap: 8px;
  margin-left: 10px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &.copy-path-btn:hover {
    color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
  }

  &.remove-btn:hover {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.1);
  }
}

.error-msg {
  color: #ff4757;
  font-size: 12px;
  margin-top: 4px;
}
</style>