export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
export const TEXT_EXTENSIONS = ['xml', 'json', 'txt']
export const XML_EXTENSIONS = ['xml']
export const PDF_EXTENSIONS = ['pdf']

export const ALLOWED_UPLOAD_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.xml', '.json', '.zip', '.rar', '.7z',
  '.ttf', '.otf', '.woff', '.woff2'
]

export const ACCEPT_FILE_TYPES = ALLOWED_UPLOAD_EXTENSIONS.join(',')

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export const getExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return ''
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === filename.length - 1) return ''
  return filename.slice(lastDot + 1).toLowerCase()
}

export const isImageFile = (filename) => IMAGE_EXTENSIONS.includes(getExtension(filename))
export const isTextFile = (filename) => TEXT_EXTENSIONS.includes(getExtension(filename))
export const isXmlFile = (filename) => XML_EXTENSIONS.includes(getExtension(filename))
export const isPdfFile = (filename) => PDF_EXTENSIONS.includes(getExtension(filename))
export const isPreviewableFile = (filename) =>
  isImageFile(filename) || isTextFile(filename) || isPdfFile(filename)

export const isAllowedUploadExtension = (filename) => {
  const ext = getExtension(filename)
  return Boolean(ext) && ALLOWED_UPLOAD_EXTENSIONS.includes(`.${ext}`)
}
