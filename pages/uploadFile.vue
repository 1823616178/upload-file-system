<template>
  <div class="upload-page">
    <div class="upload-container">
      <div class="header">
        <h1 class="title">文件上传中心</h1>
        <p class="subtitle">安全传输 · 实时进度 · 支持图片 / 文档 / 字体 / 压缩包 · 最大 100MB</p>
      </div>

      <div
        class="upload-zone"
        :class="{ 'drag-over': isDragOver, uploading: isUploading }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="ACCEPT_FILE_TYPES"
          @change="handleFileSelect"
          class="file-input"
        />

        <div class="upload-icon">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00d4ff" />
                <stop offset="100%" stop-color="#0099ff" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="none" stroke="url(#uploadGrad)" stroke-width="2" />
            <path
              d="M32 18 L32 45 M32 18 L23 28 M32 18 L41 28"
              stroke="url(#uploadGrad)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
            <line x1="20" y1="50" x2="44" y2="50" stroke="url(#uploadGrad)" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <div class="upload-text" v-if="!isUploading">
          <p class="primary-text">拖拽文件到此处，或点击选择文件</p>
          <p class="secondary-text">支持批量上传 · 自动生成时间戳防覆盖 · 单文件最大 100MB</p>
        </div>

        <div class="uploading-text" v-else>
          <p class="primary-text">正在极速传输 ({{ currentFileIndex }}/{{ totalUploadCount }})...</p>
          <p class="secondary-text">{{ uploadProgress }}%</p>
          <div class="batch-progress-track">
            <div class="batch-progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-bar" v-if="fileList.length > 0">
        <div class="queue-summary">
          <span>队列共 {{ fileList.length }} 个文件</span>
          <span v-if="pendingCount > 0" class="summary-dot">· {{ pendingCount }} 个待上传</span>
        </div>
        <div class="action-buttons">
          <button
            v-if="hasCompletedFiles && !isUploading"
            type="button"
            @click="clearCompleted"
            class="secondary-action-btn"
          >
            清空已完成
          </button>
          <button
            type="button"
            @click="startUpload"
            class="start-upload-btn"
            :disabled="isUploading || !hasPendingFiles"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {{ isUploading ? `上传中 ${uploadProgress}%` : hasErrorFiles && pendingOnlyCount === 0 ? '重试失败项' : '开始上传' }}
          </button>
        </div>
      </div>

      <div class="file-list" v-if="fileList.length > 0">
        <div class="file-list-header">
          <h3 class="file-list-title">传输队列</h3>
          <NuxtLink to="/history" class="view-history-btn">查看历史记录 →</NuxtLink>
        </div>

        <TransitionGroup name="file-queue" tag="div" class="file-items">
          <div v-for="(file, index) in fileList" :key="file.id" class="file-item" :class="`status-${file.status}`">
            <div class="file-icon">
              <img v-if="file.thumbUrl" :src="file.thumbUrl" :alt="file.name" class="local-thumb" />
              <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
                  stroke="#00d4ff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <div class="file-info">
              <p class="file-name" :title="file.name">{{ file.name }}</p>
              <div class="file-meta-row">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span v-if="file.status === 'uploading'" class="file-percent">{{ file.progress }}%</span>
              </div>
              <div v-if="file.status === 'uploading'" class="item-progress-track">
                <div class="item-progress-fill" :style="{ width: `${file.progress}%` }"></div>
              </div>
              <p class="file-path" v-if="file.remotePath" :title="file.remotePath">
                已保存为：{{ getFileNameFromPath(file.remotePath) }}
              </p>
              <p class="error-msg" v-if="file.status === 'error' && file.errorMsg">{{ file.errorMsg }}</p>
            </div>

            <div class="file-status" :class="file.status">
              {{ getStatusText(file.status) }}
            </div>

            <div class="file-actions">
              <button
                v-if="file.status === 'success' && file.remotePath"
                type="button"
                @click="copyPath(file.remotePath)"
                class="icon-btn copy-path-btn"
                title="复制访问链接"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke-linecap="round" />
                </svg>
              </button>

              <button
                v-if="file.status === 'pending' || file.status === 'error'"
                type="button"
                @click="removeFile(index)"
                class="icon-btn remove-btn"
                title="移除文件"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { toast } from '~/utils/toast'
import {
  ACCEPT_FILE_TYPES,
  MAX_UPLOAD_BYTES,
  isAllowedUploadExtension,
  isImageFile
} from '~/utils/fileTypes'
import { formatFileSize, getFileNameFromPath, getPreviewUrl } from '~/utils/format'
import { copyToClipboard } from '~/utils/clipboard'
import { uploadWithProgress } from '~/utils/http'

let uidSeq = 1
const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const currentFileIndex = ref(0)
const totalUploadCount = ref(0)
const fileList = ref([])

const hasPendingFiles = computed(() =>
  fileList.value.some(f => f.status === 'pending' || f.status === 'error')
)
const pendingCount = computed(() =>
  fileList.value.filter(f => f.status === 'pending' || f.status === 'error').length
)
const pendingOnlyCount = computed(() =>
  fileList.value.filter(f => f.status === 'pending').length
)
const hasErrorFiles = computed(() =>
  fileList.value.some(f => f.status === 'error')
)
const hasCompletedFiles = computed(() =>
  fileList.value.some(f => f.status === 'success')
)

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleDragOver = () => {
  if (!isUploading.value) isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  isDragOver.value = false
  if (isUploading.value) return
  const files = e.dataTransfer?.files
  if (files?.length > 0) {
    addFiles(files)
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files?.length > 0) {
    addFiles(files)
  }
  e.target.value = ''
}

const revokeThumb = (item) => {
  if (item?.thumbUrl) {
    URL.revokeObjectURL(item.thumbUrl)
  }
}

const addFiles = (files) => {
  const newFiles = []

  for (const file of Array.from(files)) {
    if (!isAllowedUploadExtension(file.name)) {
      toast.warning(`文件 ${file.name} 格式不支持`)
      continue
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.warning(`文件 ${file.name} 超过 100MB 限制`)
      continue
    }

    const thumbUrl = isImageFile(file.name) && file.size <= 15 * 1024 * 1024
      ? URL.createObjectURL(file)
      : ''

    newFiles.push({
      id: `up_${Date.now()}_${uidSeq++}`,
      fileObject: file,
      name: file.name,
      size: file.size,
      progress: 0,
      thumbUrl,
      status: 'pending',
      errorMsg: '',
      remotePath: ''
    })
  }

  if (newFiles.length > 0) {
    fileList.value = [...newFiles, ...fileList.value]
  }
}

const removeFile = (index) => {
  const [removed] = fileList.value.splice(index, 1)
  revokeThumb(removed)
}

const clearCompleted = () => {
  const remaining = []
  for (const item of fileList.value) {
    if (item.status === 'success') {
      revokeThumb(item)
    } else {
      remaining.push(item)
    }
  }
  fileList.value = remaining
}

const startUpload = async () => {
  const queue = fileList.value.filter(f => f.status === 'pending' || f.status === 'error')
  if (queue.length === 0) {
    toast.info('没有待上传的文件')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  totalUploadCount.value = queue.length
  currentFileIndex.value = 0

  const totalBytes = queue.reduce((sum, item) => sum + Math.max(1, item.size), 0)
  let completedBytes = 0
  let successCount = 0

  for (let i = 0; i < queue.length; i++) {
    const fileItem = queue[i]
    currentFileIndex.value = i + 1
    fileItem.status = 'uploading'
    fileItem.progress = 0
    fileItem.errorMsg = ''

    try {
      const formData = new FormData()
      formData.append('file', fileItem.fileObject)

      const response = await uploadWithProgress({
        url: '/api/upload',
        formData,
        onProgress: ({ loaded, total, percent }) => {
          fileItem.progress = percent
          const currentLoaded = total > 0 ? Math.min(fileItem.size, Math.round((loaded / total) * fileItem.size)) : 0
          uploadProgress.value = Math.min(99, Math.round(((completedBytes + currentLoaded) / totalBytes) * 100))
        }
      })

      if (response.success) {
        fileItem.status = 'success'
        fileItem.progress = 100
        fileItem.remotePath = response.remotePath
        successCount++
      } else {
        fileItem.status = 'error'
        fileItem.errorMsg = response.error || '上传失败'
      }
    } catch (error) {
      fileItem.status = 'error'
      fileItem.errorMsg = error.message || '请求失败'
    }

    completedBytes += Math.max(1, fileItem.size)
    uploadProgress.value = Math.round((completedBytes / totalBytes) * 100)
  }

  isUploading.value = false

  if (successCount === queue.length) {
    toast.success(`成功上传 ${successCount} 个文件`)
  } else if (successCount > 0) {
    toast.warning(`完成上传：成功 ${successCount} 个，失败 ${queue.length - successCount} 个`)
  } else {
    toast.error('上传失败，请检查文件或网络后重试')
  }
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

const copyPath = async (remotePath) => {
  const url = getPreviewUrl(remotePath)
  const success = await copyToClipboard(url)
  if (success) {
    toast.success('访问链接已复制到剪贴板')
  } else {
    toast.error('复制失败，请手动复制')
  }
}

onUnmounted(() => {
  for (const item of fileList.value) {
    revokeThumb(item)
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/upload.scss';
</style>
