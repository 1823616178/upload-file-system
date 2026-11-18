export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export const getFileNameFromPath = (filePath) => {
  if (!filePath) return ''
  const parts = String(filePath).split('/')
  return parts[parts.length - 1] || filePath
}

export const getPreviewUrl = (remotePath, { relative = false } = {}) => {
  if (!remotePath) return ''
  const target = relative ? remotePath : getFileNameFromPath(remotePath)
  const pathUrl = `/api/ftp-image?path=${encodeURIComponent(target)}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${pathUrl}`
  }
  return pathUrl
}

export const getThumbnailUrl = (remotePath, size = 120, { relative = false } = {}) => {
  if (!remotePath) return ''
  const target = relative ? remotePath : getFileNameFromPath(remotePath)
  return `/api/ftp-thumbnail?path=${encodeURIComponent(target)}&size=${size}`
}

export const getDownloadUrl = (remotePath, { relative = false } = {}) => {
  if (!remotePath) return ''
  const target = relative ? remotePath : getFileNameFromPath(remotePath)
  return `/api/ftp-download?path=${encodeURIComponent(target)}`
}
