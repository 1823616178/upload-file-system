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
                        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                        <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <input type="text" v-model="searchQuery" @input="handleSearch" placeholder="搜索文件名..."
                        class="search-input" />
                </div>
            </div>

            <!-- 历史记录列表 -->
            <div class="history-list" v-if="historyList.length > 0">
                <div class="history-items">
                    <div v-for="item in historyList" :key="item.id" class="history-item" @click="handleItemClick(item)">
                        <div class="item-icon">
                            <template v-if="isImage(item.fileName)">
                                <img :src="getThumbnailUrl(item.remotePath)" :alt="item.fileName" class="thumbnail-img"
                                    loading="lazy"
                                    @error="$event.target.style.display = 'none'; $event.target.nextElementSibling.style.display = 'flex'" />
                                <div class="thumbnail-fallback" style="display: none;">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                            stroke="#00d4ff" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round" />
                                        <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round" />
                                    </svg>
                                </div>
                            </template>
                            <template v-else>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                        stroke="#00d4ff" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M14 2V8H20" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </template>
                        </div>
                        <div class="item-info">
                            <h4 class="item-name clickable" @click.stop="copyFileName(item.fileName)" title="点击复制文件名">{{
                                item.fileName }}</h4>
                            <div class="item-meta">
                                <span class="meta-item">
                                    <svg viewBox="0 0 16 16" class="meta-icon">
                                        <path
                                            d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm.5-8H7v6h1.5v-2h1.5l1 2H13l-1.2-2.3c.7-.3 1.2-1 1.2-1.9 0-1.2-.9-2.1-2.1-2.1z"
                                            fill="currentColor" />
                                    </svg>
                                    {{ item.fileSizeFormatted }}
                                </span>
                                <span class="meta-item">
                                    <svg viewBox="0 0 16 16" class="meta-icon">
                                        <path
                                            d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 11c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"
                                            fill="currentColor" />
                                        <circle cx="8" cy="5" r="1" fill="currentColor" />
                                        <path d="M8 7v5" stroke="currentColor" stroke-width="1"
                                            stroke-linecap="round" />
                                    </svg>
                                    {{ formatDate(item.uploadTime) }}
                                </span>
                                <span class="meta-item" v-if="item.ipAddress && item.ipAddress !== '-'"
                                    :title="locations[item.ipAddress] || '正在解析位置...'">
                                    <svg viewBox="0 0 24 24" class="meta-icon">
                                        <path
                                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                            fill="currentColor" />
                                    </svg>
                                    {{ item.ipAddress }} <span class="location-text"
                                        v-if="locations[item.ipAddress]">({{
                                            locations[item.ipAddress] }})</span>
                                </span>
                            </div>
                            <div class="item-path" :title="item.remotePath">
                                {{ getFileNameFromPath(item.remotePath) }}
                            </div>
                            <div class="item-source" v-if="item.source">
                                <span class="source-tag" :class="item.source">{{ item.source === 'ftp' ? 'FTP' : 'DB'
                                }}</span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button @click.stop="previewImage(item)" class="action-btn preview-btn" title="预览">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                            <button @click.stop="copyPath(item.remotePath)" class="action-btn copy-btn" title="复制链接">
                                <svg viewBox="0 0 24 24">
                                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor"
                                        stroke-width="2" fill="none" />
                                    <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </button>
                            <button @click.stop="openRenameModal(item)" class="action-btn rename-btn" title="重命名">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button @click.stop="deleteRecord(item.id, item.source, item.remotePath)"
                                class="action-btn delete-btn" title="删除记录">
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M3 6H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6M10 11V17M14 11V17"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" fill="none" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 分页 -->
                <div class="pagination" v-if="totalPages > 1">
                    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn">
                        上一页
                    </button>
                    <div class="pagination-info">
                        第 {{ currentPage }} / {{ totalPages }} 页
                    </div>
                    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
                        class="pagination-btn">
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
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" fill="none" />
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
                        <img v-else :src="preview.url" :alt="preview.fileName" class="preview-image"
                            @click="copyUrl(preview.url)" title="点击复制链接" />
                    </div>
                    <div class="modal-footer">
                        <button @click="downloadImage" class="download-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" fill="none" />
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
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" fill="none" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="warning-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z">
                                </path>
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

            <!-- 重命名模态框 -->
            <div class="confirm-modal" v-if="renameModal.show" @click.self="closeRenameModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>重命名文件</h3>
                        <button @click="closeRenameModal" class="close-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" fill="none" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <input type="text" v-model="renameModal.newName" class="rename-input" placeholder="请输入新文件名"
                                @keyup.enter="executeRename" ref="renameInputRef" />
                            <p class="input-hint">不需要包含文件后缀，系统会自动保留</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeRenameModal" class="btn cancel-btn">取消</button>
                        <button @click="executeRename" class="btn confirm-btn" :disabled="renameModal.loading">
                            {{ renameModal.loading ? '处理中...' : '确认修改' }}
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
const locations = ref({})

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

// 解析 IP 地址
const resolveIpLocations = async (list) => {
    const ips = [...new Set(list.map(item => item.ipAddress).filter(ip => ip && ip !== '-' && !locations.value[ip]))]

    for (const ip of ips) {
        // 简单过滤内网 IP
        if (ip.startsWith('192.168.') || ip.startsWith('127.') || ip.startsWith('10.')) {
            locations.value[ip] = '内网IP'
            continue
        }

        try {
            // 使用免费的 ip-api.com (注意：该 API 为 http，https 站点可能受限，但在本地/开发环境通常可用)
            // 如果是生产环境 https，建议后端代理或使用支持 https 的服务
            const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`)
            const data = await res.json()
            if (data.status === 'success') {
                locations.value[ip] = `${data.regionName} ${data.city}`
            } else {
                locations.value[ip] = '未知位置'
            }
        } catch (e) {
            console.warn(`无法解析 IP ${ip}`, e)
        }
    }
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
            // 异步解析 IP
            resolveIpLocations(historyList.value)
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

// 判断是否为图片
const isImage = (filename) => {
    if (!filename) return false
    const ext = filename.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

// 获取预览 URL
const getPreviewUrl = (path) => {
    if (!path) return ''
    // 只传递文件名，不传递完整路径
    const fileName = path.split('/').pop()
    return `${window.location.origin}/api/ftp-image?path=${encodeURIComponent(fileName)}`
}

// 获取缩略图 URL
const getThumbnailUrl = (path) => {
    if (!path) return ''
    const fileName = path.split('/').pop()
    return `${window.location.origin}/api/ftp-thumbnail?path=${encodeURIComponent(fileName)}&size=120`
}

// 从路径中提取文件名
const getFileNameFromPath = (path) => {
    if (!path) return ''
    const parts = path.split('/')
    return parts[parts.length - 1] || path
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

// 复制文本到剪贴板（带降级方案）
const copyToClipboard = async (text) => {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (err) {
            console.warn('Clipboard API 失败，尝试降级方案:', err)
        }
    }

    // 降级方案：使用 execCommand
    try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.width = '1px'
        textarea.style.height = '1px'
        textarea.style.padding = '0'
        textarea.style.border = 'none'
        textarea.style.outline = 'none'
        textarea.style.boxShadow = 'none'
        textarea.style.background = 'transparent'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)

        if (successful) {
            return true
        }
        throw new Error('execCommand 复制失败')
    } catch (err) {
        console.error('降级复制方案也失败:', err)
        return false
    }
}

// 复制 URL
const copyUrl = async (url) => {
    if (!url) return
    const success = await copyToClipboard(url)
    if (success) {
        toast.success('链接已复制到剪贴板')
    } else {
        toast.error('复制失败，请手动复制')
    }
}

// 复制文件名
const copyFileName = async (fileName) => {
    if (!fileName) return
    const success = await copyToClipboard(fileName)
    if (success) {
        toast.success('文件名已复制到剪贴板')
    } else {
        toast.error('复制失败，请手动复制')
    }
}

// 复制链接
const copyPath = async (path) => {
    const url = getPreviewUrl(path)
    const success = await copyToClipboard(url)
    if (success) {
        toast.success('链接已复制到剪贴板')
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

            // 从列表中移除该项（统一转为字符串比较，避免 BigInt/Number 类型不一致）
            historyList.value = historyList.value.filter(item => String(item.id) !== String(id))
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

// 打开重命名模态框
const openRenameModal = (item) => {
    const nameWithoutExt = item.fileName.substring(0, item.fileName.lastIndexOf('.')) || item.fileName
    renameModal.value = {
        show: true,
        id: item.id,
        source: item.source,
        remotePath: item.remotePath,
        oldName: item.fileName,
        newName: nameWithoutExt,
        loading: false
    }
    // 自动聚焦
    setTimeout(() => {
        renameInputRef.value?.focus()
        renameInputRef.value?.select()
    }, 100)
}

// 关闭重命名模态框
const closeRenameModal = () => {
    renameModal.value.show = false
}

// 执行重命名
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
                id,
                oldName,
                newName,
                source,
                remotePath
            }
        })

        if (response.success) {
            toast.success('重命名成功')
            closeRenameModal()

            // 更新列表中的文件名
            const index = historyList.value.findIndex(item => item.id === id)
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
        console.error('重命名失败:', error)
        toast.error('重命名请求失败')
    } finally {
        renameModal.value.loading = false
    }
}

onMounted(() => {
    loadHistory()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/history.scss';

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
        height: 400px;
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

.location-text {
    color: #00d4ff;
    margin-left: 4px;
    font-size: 0.9em;
}

// 预览按钮样式
.preview-btn {
    background: rgba(0, 212, 255, 0.1) !important;
    border-color: rgba(0, 212, 255, 0.3) !important;

    &:hover {
        background: rgba(0, 212, 255, 0.2) !important;
    }
}

.rename-btn {
    background: rgba(255, 165, 2, 0.1) !important;
    border-color: rgba(255, 165, 2, 0.3) !important;
    color: #ffa502 !important;

    &:hover {
        background: rgba(255, 165, 2, 0.2) !important;
    }
}

// 重命名输入框样式
.input-group {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.rename-input {
    width: 100%;
    box-sizing: border-box; // 显式声明
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 6px;
    padding: 12px 15px;
    color: #fff;
    font-size: 15px;
    outline: none;
    transition: all 0.3s ease;
    margin: 0;

    &:focus {
        border-color: #00d4ff;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
    }
}

.input-hint {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin-top: 8px;
    text-align: left;
}

.btn.confirm-btn {
    background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
    color: #fff;
    border: none;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
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
