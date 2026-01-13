<template>
  <div class="upload-page">
    <div class="upload-container">
      <div class="header">
        <h1 class="title">文件上传中心</h1>
        <p class="subtitle">安全传输 · 高效管理 · 智能存储</p>
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
          <p class="secondary-text">支持多文件上传</p>
        </div>

        <div class="uploading-text" v-else>
          <p class="primary-text">正在上传...</p>
          <p class="secondary-text">{{ uploadProgress }}%</p>
        </div>
      </div>

      <div class="file-list" v-if="uploadedFiles.length > 0">
        <h3 class="file-list-title">已上传文件</h3>
        <div class="file-items">
          <div
            v-for="(file, index) in uploadedFiles"
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
              <p class="file-name">{{ file.name }}</p>
              <p class="file-size">{{ formatFileSize(file.size) }}</p>
            </div>
            <div class="file-status" :class="file.status">
              {{ getStatusText(file.status) }}
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
import { ref } from 'vue'

const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadedFiles = ref([])
const message = ref('')
const messageClass = ref('')

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
    uploadFiles(files)
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    uploadFiles(files)
  }
  e.target.value = ''
}

const uploadFiles = async (files) => {
  isUploading.value = true
  uploadProgress.value = 0
  message.value = ''

  const fileArray = Array.from(files)

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    const fileInfo = {
      name: file.name,
      size: file.size,
      status: 'uploading'
    }
    uploadedFiles.value.push(fileInfo)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('remotePath', '/static/wenjinyangyi')

      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        fileInfo.status = 'success'
      } else {
        fileInfo.status = 'error'
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      fileInfo.status = 'error'
      console.error('上传失败:', error)
    }

    uploadProgress.value = Math.round(((i + 1) / fileArray.length) * 100)
  }

  isUploading.value = false

  const successCount = uploadedFiles.value.filter(f => f.status === 'success').length
  const totalCount = fileArray.length

  if (successCount === totalCount) {
    message.value = `成功上传 ${successCount} 个文件`
    messageClass.value = 'success'
  } else if (successCount > 0) {
    message.value = `成功上传 ${successCount}/${totalCount} 个文件`
    messageClass.value = 'warning'
  } else {
    message.value = '上传失败，请重试'
    messageClass.value = 'error'
  }

  setTimeout(() => {
    message.value = ''
  }, 3000)
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
    uploading: '上传中...',
    success: '上传成功',
    error: '上传失败'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
@import '~/assets/styles/upload.scss';
</style>
