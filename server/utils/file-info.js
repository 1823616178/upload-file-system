import path from 'path'

// 服务端共享的文件类型 / MIME / 大小格式化工具（此前在多个 API 中重复且不同步）

// 允许上传的 MIME 类型
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/json',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/font-sfnt',
  'application/x-font-ttf',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'font/woff',
  'application/font-woff2',
  'font/woff2'
]

// 允许上传的扩展名
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.xml', '.json', '.zip', '.rar', '.7z',
  '.ttf', '.otf', '.woff', '.woff2'
]

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

export const getExtension = (filename) => path.extname(filename || '').toLowerCase()

// 图片扩展名（不含点，供缩略图/预览判断）
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

// 根据文件名扩展名获取 MIME 类型
export const getMimeType = (filename) => {
  return MIME_BY_EXTENSION[getExtension(filename)] || 'application/octet-stream'
}

// 上传校验：扩展名或 MIME 类型任一命中即通过
export const isAllowedUploadFile = (filename, mimeType) => {
  return ALLOWED_EXTENSIONS.includes(getExtension(filename)) ||
    ALLOWED_MIME_TYPES.includes(mimeType?.toLowerCase())
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 生成 yyyyMMdd_HHmmss 时间戳（用于上传/重命名的默认文件名）
export const formatTimestamp = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

// 根据文件扩展名判断分类（历史记录筛选用）
const FILE_CATEGORY_MAP = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.xml', '.json'],
  archive: ['.zip', '.rar', '.7z'],
  font: ['.ttf', '.otf', '.woff', '.woff2']
}

export const getFileCategory = (filename) => {
  const ext = getExtension(filename)
  for (const [category, extensions] of Object.entries(FILE_CATEGORY_MAP)) {
    if (extensions.includes(ext)) return category
  }
  return 'other'
}
