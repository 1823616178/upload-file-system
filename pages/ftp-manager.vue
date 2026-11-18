<template>
  <div class="ftp-manager-page">
    <div class="ftp-container">
      <div class="header">
        <h1 class="title">FTP 文件管理</h1>
        <p class="subtitle" v-if="!isShowingSearchResults">浏览并管理基准目录下的文件与文件夹（支持拖拽上传）</p>
        <p class="subtitle" v-else>搜索结果: "{{ searchQuery }}"（共 {{ files.length }} 项）</p>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="breadcrumb">
          <span class="breadcrumb-item" :class="{ active: pathSegments.length === 0 }" @click="navigateTo('.')" title="根目录">
            <svg viewBox="0 0 24 24" class="home-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" fill="none" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
            <span class="root-label">根目录</span>
          </span>
          <template v-for="(segment, index) in pathSegments" :key="`${index}-${segment}`">
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
            <button type="button" class="search-btn" @click="handleAction" :title="searching ? '取消搜索' : '搜索'">
              <template v-if="!searching">
                <svg viewBox="0 0 24 24">
                  <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" class="cancel-icon">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </template>
            </button>
          </div>

          <select v-model="sortField" class="sort-select" title="排序方式">
            <option value="name">按名称</option>
            <option value="size">按大小</option>
            <option value="time">按时间</option>
          </select>

          <button type="button" class="action-btn sort-order-btn" @click="toggleSortOrder" :title="sortOrder === 'asc' ? '升序' : '降序'">
            <svg viewBox="0 0 24 24" v-if="sortOrder === 'asc'">
              <path d="M3 6h10M3 12h7M3 18h4M17 4v16M17 4l4 4M17 4l-4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg viewBox="0 0 24 24" v-else>
              <path d="M3 6h4M3 12h7M3 18h10M17 20V4M17 20l4-4M17 20l-4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <button type="button" class="action-btn new-folder-btn" @click="openMkdirModal" :disabled="loading || isShowingSearchResults">
            <svg viewBox="0 0 24 24">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none" />
              <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>新建文件夹</span>
          </button>

          <button type="button" class="action-btn upload-btn" @click="triggerUpload" :disabled="uploading || isShowingSearchResults">
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>{{ uploading ? uploadStatusText : '上传文件' }}</span>
          </button>
          <input
            ref="uploadInputRef"
            type="file"
            multiple
            :accept="ACCEPT_FILE_TYPES"
            class="hidden-file-input"
            @change="handleUploadSelect"
          />

          <button type="button" class="action-btn refresh-btn" @click="loadDirectory" :disabled="loading">
            <svg viewBox="0 0 24 24" :class="{ spinning: loading }">
              <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>刷新</span>
          </button>

          <button type="button" class="action-btn back-btn" @click="goBack" :disabled="(currentPath === '.' && !isShowingSearchResults) || loading">
            <svg viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ isShowingSearchResults ? '返回目录' : '返回上级' }}</span>
          </button>
        </div>
      </div>

      <!-- 上传进度条 -->
      <Transition name="drawer-slide">
        <div v-if="uploading" class="upload-progress-banner">
          <div class="progress-banner-info">
            <span>{{ uploadStatusText }}</span>
            <span>{{ uploadProgressPercent }}%</span>
          </div>
          <div class="progress-banner-track">
            <div class="progress-banner-fill" :style="{ width: `${uploadProgressPercent}%` }"></div>
          </div>
        </div>
      </Transition>

      <!-- 批量操作栏 -->
      <Transition name="drawer-slide">
        <div class="batch-bar" v-if="selectedFiles.size > 0">
          <span>已选择 <strong>{{ selectedFiles.size }}</strong> 项</span>
          <div class="batch-actions">
            <button type="button" class="btn cancel-btn" @click="clearSelection">取消选择</button>
            <button type="button" class="btn danger-btn" @click="openBatchDeleteModal">批量删除</button>
          </div>
        </div>
      </Transition>

      <!-- 文件列表（支持拖拽上传） -->
      <div
        class="file-list-container"
        :class="{ 'drop-active': isDropActive }"
        @dragover.prevent="onListDragOver"
        @dragleave.prevent="onListDragLeave"
        @drop.prevent="onListDrop"
      >
        <div v-if="isDropActive" class="drop-overlay">
          <div class="drop-overlay-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>释放文件即可上传至当前目录</p>
          </div>
        </div>

        <div class="file-list-header">
          <div class="col-check">
            <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" title="全选" />
          </div>
          <div class="col-name">名称</div>
          <div class="col-size">大小</div>
          <div class="col-time">修改时间</div>
          <div class="col-actions">操作</div>
        </div>

        <div class="file-list" v-if="!loading && files.length > 0">
          <div
            v-for="file in sortedFiles"
            :key="file.fullPath"
            class="file-item"
            :class="{ 'is-directory': file.isDirectory, selected: isSelected(file) }"
            @click="handleClick(file)"
            @dblclick="handleDoubleClick(file)"
          >
            <div class="col-check" @click.stop>
              <input type="checkbox" :checked="isSelected(file)" @change="toggleSelect(file)" />
            </div>

            <div class="col-name">
              <div class="file-icon">
                <svg v-if="file.isDirectory" viewBox="0 0 24 24">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
                <svg v-else-if="isImage(file.name)" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none" />
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </div>
              <div class="name-stack">
                <span class="file-name" :title="file.name">{{ file.name }}</span>
                <span v-if="isShowingSearchResults" class="search-subpath" :title="file.fullPath">{{ file.fullPath }}</span>
              </div>
            </div>

            <div class="col-size">{{ file.isDirectory ? '-' : file.sizeFormatted }}</div>
            <div class="col-time">{{ formatTime(file.modifyTime) }}</div>

            <div class="col-actions">
              <button
                v-if="file.isDirectory"
                type="button"
                class="btn-icon open-btn"
                @click.stop="navigateTo(file.fullPath)"
                title="打开文件夹"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2" stroke="currentColor" stroke-width="2" fill="none" />
                  <path d="M15 13l-3 3m0 0l-3-3m3 3V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                v-if="!file.isDirectory && isPreviewable(file.name)"
                type="button"
                class="btn-icon preview-btn"
                @click.stop="previewFile(file)"
                title="在线预览"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </button>
              <button
                v-if="!file.isDirectory"
                type="button"
                class="btn-icon download-btn"
                @click.stop="downloadFile(file)"
                title="下载"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none" />
                  <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" fill="none" />
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" />
                </svg>
              </button>
              <button
                type="button"
                class="btn-icon rename-btn"
                @click.stop="openRenameModal(file)"
                title="重命名"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" fill="none" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </button>
              <button
                type="button"
                class="btn-icon delete-btn"
                @click.stop="openDeleteModal(file)"
                title="删除"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" stroke-width="2" fill="none" />
                  <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2" />
                  <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else-if="!loading && files.length === 0">
          <svg viewBox="0 0 24 24" class="empty-icon">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          <p v-if="isShowingSearchResults">未找到匹配的文件</p>
          <p v-else>该目录为空，可点击上方按钮或直接拖拽文件到此区域上传</p>
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

    <!-- 多类型预览模态框 -->
    <Transition name="modal-fade">
      <div class="modal preview-modal" v-if="previewModal.show" @click.self="closePreviewModal">
        <div class="modal-content preview-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>{{ previewModal.fileName }}</h3>
            <button type="button" @click="closePreviewModal" class="close-btn" aria-label="关闭">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="previewModal.loading" class="preview-loading">
              <GlobalLoader text="正在加载文件..." />
            </div>
            <div v-else-if="previewModal.error" class="preview-error-box">
              <p>{{ previewModal.error }}</p>
            </div>
            <img
              v-else-if="previewModal.type === 'image'"
              :src="previewModal.url"
              :alt="previewModal.fileName"
              class="preview-image"
              @error="previewModal.error = '图片加载失败或文件不存在'"
            />
            <pre v-else-if="previewModal.type === 'text'" class="xml-content"><code>{{ previewModal.content }}</code></pre>
            <iframe v-else-if="previewModal.type === 'pdf'" :src="previewModal.url" class="preview-pdf" title="PDF 预览"></iframe>
          </div>
          <div class="modal-footer">
            <button
              v-if="previewModal.type === 'text' && previewModal.content"
              type="button"
              @click="copyPreviewContent"
              class="btn cancel-btn"
            >
              复制内容
            </button>
            <button type="button" @click="downloadFile(previewModal.file)" class="btn primary-btn">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none" />
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" fill="none" />
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" />
              </svg>
              下载文件
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 批量删除确认模态框 -->
    <Transition name="modal-fade">
      <div class="modal" v-if="batchDeleteModal.show" @click.self="closeBatchDeleteModal">
        <div class="modal-content danger" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>确认批量删除</h3>
            <button type="button" @click="closeBatchDeleteModal" class="close-btn" aria-label="关闭">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <p class="confirm-text">
              确定要删除选中的 <strong>{{ selectedFiles.size }}</strong> 项吗？
              <br /><span class="danger-text">其中的目录及其所有内容也将被永久删除！</span>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeBatchDeleteModal" class="btn cancel-btn">取消</button>
            <button type="button" @click="executeBatchDelete" class="btn danger-btn" :disabled="batchDeleteModal.loading">
              {{ batchDeleteModal.loading ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 新建文件夹模态框 -->
    <Transition name="modal-fade">
      <div class="modal" v-if="mkdirModal.show" @click.self="closeMkdirModal">
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>新建文件夹</h3>
            <button type="button" @click="closeMkdirModal" class="close-btn" aria-label="关闭">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label>文件夹名称</label>
              <input
                type="text"
                v-model="mkdirModal.name"
                @keyup.enter="executeMkdir"
                ref="mkdirInputRef"
                placeholder="请输入文件夹名称"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeMkdirModal" class="btn cancel-btn">取消</button>
            <button type="button" @click="executeMkdir" class="btn primary-btn" :disabled="mkdirModal.loading">
              {{ mkdirModal.loading ? '创建中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 重命名模态框 -->
    <Transition name="modal-fade">
      <div class="modal" v-if="renameModal.show" @click.self="closeRenameModal">
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>重命名</h3>
            <button type="button" @click="closeRenameModal" class="close-btn" aria-label="关闭">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" />
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
            <button type="button" @click="closeRenameModal" class="btn cancel-btn">取消</button>
            <button type="button" @click="executeRename" class="btn primary-btn" :disabled="renameModal.loading">
              {{ renameModal.loading ? '处理中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 删除确认模态框 -->
    <Transition name="modal-fade">
      <div class="modal" v-if="deleteModal.show" @click.self="closeDeleteModal">
        <div class="modal-content danger" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>确认删除</h3>
            <button type="button" @click="closeDeleteModal" class="close-btn" aria-label="关闭">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <p class="confirm-text">
              确定要删除 <strong>{{ deleteModal.fileName }}</strong> 吗？
              <template v-if="deleteModal.isDirectory">
                <br /><span class="danger-text">该目录下的所有文件也将被删除！</span>
              </template>
            </p>
            <div class="input-group" v-if="deleteModal.isDirectory">
              <label>请输入目录名 <strong>{{ deleteModal.fileName }}</strong> 以确认删除</label>
              <input
                type="text"
                v-model="deleteModal.confirmText"
                @keyup.enter="executeDelete"
                placeholder="输入目录名确认"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeDeleteModal" class="btn cancel-btn">取消</button>
            <button
              type="button"
              @click="executeDelete"
              class="btn danger-btn"
              :disabled="deleteModal.loading || (deleteModal.isDirectory && deleteModal.confirmText !== deleteModal.fileName)"
            >
              {{ deleteModal.loading ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { toast } from '~/utils/toast'
import {
  ACCEPT_FILE_TYPES,
  MAX_UPLOAD_BYTES,
  isAllowedUploadExtension,
  isImageFile,
  isTextFile,
  isPdfFile,
  isPreviewableFile
} from '~/utils/fileTypes'
import { copyToClipboard } from '~/utils/clipboard'
import { decodeBase64Utf8, handleUnauthorized, uploadWithProgress } from '~/utils/http'

const loading = ref(false)
const searching = ref(false)
const currentPath = ref('.') // 统一以 '.' 表示服务端配置的 ftpBasePath 根目录
const files = ref([])
const searchQuery = ref('')
const isShowingSearchResults = ref(false)
let searchAbortController = null

const isImage = isImageFile
const isPreviewable = isPreviewableFile

const pathSegments = computed(() => {
  if (!currentPath.value || currentPath.value === '.' || currentPath.value === '/') return []
  return currentPath.value.split('/').filter(Boolean)
})

const sortField = ref('name')
const sortOrder = ref('asc')

const sortedFiles = computed(() => {
  const list = [...files.value]
  list.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    let cmp = 0
    if (sortField.value === 'size') {
      cmp = (a.size || 0) - (b.size || 0)
    } else if (sortField.value === 'time') {
      cmp = new Date(a.modifyTime || 0).getTime() - new Date(b.modifyTime || 0).getTime()
    } else {
      cmp = a.name.localeCompare(b.name)
    }
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
  return list
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 批量选择
const selectedFiles = ref(new Map())
const isSelected = (file) => selectedFiles.value.has(file.fullPath)

const toggleSelect = (file) => {
  const map = new Map(selectedFiles.value)
  if (map.has(file.fullPath)) {
    map.delete(file.fullPath)
  } else {
    map.set(file.fullPath, file)
  }
  selectedFiles.value = map
}

const clearSelection = () => {
  selectedFiles.value = new Map()
}

const allSelected = computed(
  () => sortedFiles.value.length > 0 && sortedFiles.value.every(f => selectedFiles.value.has(f.fullPath))
)

const toggleSelectAll = () => {
  if (allSelected.value) {
    clearSelection()
  } else {
    const map = new Map()
    sortedFiles.value.forEach(f => map.set(f.fullPath, f))
    selectedFiles.value = map
  }
}

const loadDirectory = async () => {
  loading.value = true
  isShowingSearchResults.value = false
  clearSelection()
  try {
    const response = await $fetch('/api/ftp-directory', {
      query: { path: currentPath.value }
    })
    if (response.success) {
      files.value = response.data.files
    } else {
      toast.error(response.error || '加载目录失败')
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      console.error('加载目录失败:', error)
      toast.error('加载目录失败')
    }
  } finally {
    loading.value = false
  }
}

const handleAction = () => {
  if (searching.value) {
    cancelSearch()
  } else {
    handleSearch()
  }
}

const cancelSearch = () => {
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  searching.value = false
  loading.value = false
  toast.info('搜索已取消')
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    if (isShowingSearchResults.value) {
      loadDirectory()
    }
    return
  }

  if (searchAbortController) {
    searchAbortController.abort()
  }
  searchAbortController = new AbortController()
  clearSelection()

  loading.value = true
  searching.value = true
  isShowingSearchResults.value = true

  try {
    const response = await $fetch('/api/ftp-search', {
      query: {
        q: searchQuery.value.trim(),
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
      files.value = []
      isShowingSearchResults.value = true
    }
  } catch (error) {
    if (error.name === 'AbortError') return
    if (!handleUnauthorized(error)) {
      console.error('搜索失败:', error)
      files.value = []
      isShowingSearchResults.value = true
    }
  } finally {
    if (searchAbortController && !searchAbortController.signal.aborted) {
      loading.value = false
      searching.value = false
      searchAbortController = null
    }
  }
}

const navigateTo = (targetPath) => {
  currentPath.value = targetPath || '.'
  loadDirectory()
}

const navigateToSegment = (index) => {
  const newPath = pathSegments.value.slice(0, index + 1).join('/')
  navigateTo(newPath || '.')
}

const goBack = () => {
  if (isShowingSearchResults.value) {
    searchQuery.value = ''
    loadDirectory()
    return
  }
  if (!currentPath.value || currentPath.value === '.' || currentPath.value === '/') return
  const segments = [...pathSegments.value]
  segments.pop()
  navigateTo(segments.length > 0 ? segments.join('/') : '.')
}

const handleClick = (file) => {
  if (file.isDirectory) {
    navigateTo(file.fullPath)
  }
}

const handleDoubleClick = (file) => {
  if (file.isDirectory) {
    navigateTo(file.fullPath)
  } else if (isPreviewable(file.name)) {
    previewFile(file)
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '-'
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
  type: 'image', // image | text | pdf
  loading: false,
  error: null,
  file: null
})

const previewFile = async (file) => {
  const fileType = isTextFile(file.name) ? 'text' : (isPdfFile(file.name) ? 'pdf' : 'image')

  previewModal.value = {
    show: true,
    fileName: file.name,
    url: '',
    content: '',
    type: fileType,
    loading: fileType === 'text',
    error: null,
    file
  }

  if (fileType !== 'text') {
    previewModal.value.url = `/api/ftp-image?path=${encodeURIComponent(file.fullPath)}`
    return
  }

  try {
    const response = await $fetch('/api/ftp-file', {
      query: { path: file.fullPath }
    })

    if (response.success && response.data?.base64) {
      previewModal.value.content = decodeBase64Utf8(response.data.base64)
    } else {
      previewModal.value.error = response.error || '无法预览该文件'
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      previewModal.value.error = error.message || '加载预览失败'
    }
  } finally {
    previewModal.value.loading = false
  }
}

const closePreviewModal = () => {
  previewModal.value.show = false
}

const copyPreviewContent = async () => {
  const ok = await copyToClipboard(previewModal.value.content)
  if (ok) {
    toast.success('文件内容已复制到剪贴板')
  } else {
    toast.error('复制失败')
  }
}

const downloadFile = (file) => {
  if (!file) return
  const url = `/api/ftp-download?path=${encodeURIComponent(file.fullPath)}`
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
  const trimmed = newName.trim()
  if (!trimmed) {
    toast.warning('请输入新名称')
    return
  }
  if (trimmed === file.name) {
    closeRenameModal()
    return
  }

  renameModal.value.loading = true
  try {
    const response = await $fetch('/api/ftp-rename', {
      method: 'POST',
      body: {
        oldPath: file.fullPath,
        newName: trimmed
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
    if (!handleUnauthorized(error)) {
      toast.error('重命名失败')
    }
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
  confirmText: '',
  loading: false
})

const openDeleteModal = (file) => {
  deleteModal.value = {
    show: true,
    file,
    fileName: file.name,
    isDirectory: file.isDirectory,
    confirmText: '',
    loading: false
  }
}

const closeDeleteModal = () => {
  deleteModal.value.show = false
}

const executeDelete = async () => {
  const { file, isDirectory, confirmText, fileName } = deleteModal.value
  if (isDirectory && confirmText !== fileName) {
    toast.warning('请输入正确的目录名以确认删除')
    return
  }
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
    if (!handleUnauthorized(error)) {
      toast.error('删除失败')
    }
  } finally {
    deleteModal.value.loading = false
  }
}

// 批量删除模态框
const batchDeleteModal = ref({
  show: false,
  loading: false
})

const openBatchDeleteModal = () => {
  batchDeleteModal.value = { show: true, loading: false }
}

const closeBatchDeleteModal = () => {
  batchDeleteModal.value.show = false
}

const executeBatchDelete = async () => {
  batchDeleteModal.value.loading = true
  const targets = Array.from(selectedFiles.value.values())
  let successCount = 0
  let failCount = 0

  for (const file of targets) {
    try {
      const response = await $fetch('/api/ftp-delete', {
        method: 'POST',
        body: {
          path: file.fullPath,
          isDirectory: file.isDirectory
        }
      })
      if (response.success) {
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      if (handleUnauthorized(error)) break
      failCount++
    }
  }

  batchDeleteModal.value.loading = false
  closeBatchDeleteModal()
  clearSelection()

  if (successCount > 0) {
    toast.success(`成功删除 ${successCount} 项${failCount > 0 ? `，${failCount} 项失败` : ''}`)
  } else {
    toast.error('删除失败')
  }
  loadDirectory()
}

// 新建文件夹
const mkdirModal = ref({
  show: false,
  name: '',
  loading: false
})
const mkdirInputRef = ref(null)

const openMkdirModal = () => {
  mkdirModal.value = { show: true, name: '', loading: false }
  nextTick(() => {
    mkdirInputRef.value?.focus()
  })
}

const closeMkdirModal = () => {
  mkdirModal.value.show = false
}

const executeMkdir = async () => {
  if (!mkdirModal.value.name.trim()) {
    toast.warning('请输入文件夹名称')
    return
  }
  mkdirModal.value.loading = true
  try {
    const response = await $fetch('/api/ftp-mkdir', {
      method: 'POST',
      body: {
        path: currentPath.value,
        name: mkdirModal.value.name.trim()
      }
    })
    if (response.success) {
      toast.success('文件夹创建成功')
      closeMkdirModal()
      loadDirectory()
    } else {
      toast.error(response.error || '创建文件夹失败')
    }
  } catch (error) {
    if (!handleUnauthorized(error)) {
      toast.error('创建文件夹失败')
    }
  } finally {
    mkdirModal.value.loading = false
  }
}

// 上传文件到当前目录（点击选择或拖拽）
const uploading = ref(false)
const uploadStatusText = ref('上传中...')
const uploadProgressPercent = ref(0)
const uploadInputRef = ref(null)
const isDropActive = ref(false)

const triggerUpload = () => {
  uploadInputRef.value?.click()
}

const uploadBatchFiles = async (rawFiles) => {
  if (uploading.value || isShowingSearchResults.value) return
  const validFiles = []

  for (const file of rawFiles) {
    if (!isAllowedUploadExtension(file.name)) {
      toast.warning(`文件 ${file.name} 格式不支持`)
      continue
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.warning(`文件 ${file.name} 超过 100MB 限制`)
      continue
    }
    validFiles.push(file)
  }

  if (validFiles.length === 0) return

  uploading.value = true
  uploadProgressPercent.value = 0
  let successCount = 0
  let failCount = 0
  const totalBytes = validFiles.reduce((sum, f) => sum + Math.max(1, f.size), 0)
  let completedBytes = 0

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i]
    uploadStatusText.value = `上传中 (${i + 1}/${validFiles.length})`
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetDir', currentPath.value)

      const response = await uploadWithProgress({
        url: '/api/upload',
        formData,
        onProgress: ({ loaded, total }) => {
          const cur = total > 0 ? Math.min(file.size, Math.round((loaded / total) * file.size)) : 0
          uploadProgressPercent.value = Math.min(99, Math.round(((completedBytes + cur) / totalBytes) * 100))
        }
      })

      if (response.success) {
        successCount++
      } else {
        failCount++
        toast.error(`${file.name}: ${response.error || '上传失败'}`)
      }
    } catch (error) {
      failCount++
      console.error('上传失败:', error)
    }

    completedBytes += Math.max(1, file.size)
    uploadProgressPercent.value = Math.round((completedBytes / totalBytes) * 100)
  }

  uploading.value = false
  uploadStatusText.value = '上传中...'

  if (successCount > 0) {
    toast.success(`成功上传 ${successCount} 个文件${failCount > 0 ? `，${failCount} 个失败` : ''}`)
    loadDirectory()
  } else {
    toast.error('上传失败')
  }
}

const handleUploadSelect = async (e) => {
  const chosen = Array.from(e.target.files || [])
  e.target.value = ''
  if (chosen.length > 0) {
    await uploadBatchFiles(chosen)
  }
}

const onListDragOver = (e) => {
  if (uploading.value || isShowingSearchResults.value) return
  if (e.dataTransfer?.types?.includes('Files')) {
    isDropActive.value = true
  }
}

const onListDragLeave = (e) => {
  if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget)) {
    isDropActive.value = false
  }
}

const onListDrop = async (e) => {
  isDropActive.value = false
  if (uploading.value || isShowingSearchResults.value) return
  const dropped = Array.from(e.dataTransfer?.files || [])
  if (dropped.length > 0) {
    await uploadBatchFiles(dropped)
  }
}

const handleKeydown = (e) => {
  if (e.key !== 'Escape') return
  if (deleteModal.value.show) {
    closeDeleteModal()
  } else if (batchDeleteModal.value.show) {
    closeBatchDeleteModal()
  } else if (renameModal.value.show) {
    closeRenameModal()
  } else if (mkdirModal.value.show) {
    closeMkdirModal()
  } else if (previewModal.value.show) {
    closePreviewModal()
  }
}

onMounted(() => {
  loadDirectory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (searchAbortController) {
    searchAbortController.abort()
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/ftp-manager.scss';
</style>
