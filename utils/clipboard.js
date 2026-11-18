// 复制文本到剪贴板（优先使用 Clipboard API，不支持时降级到 execCommand）
export const copyToClipboard = async (text) => {
  if (typeof window === 'undefined') return false

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API 失败，尝试降级方案:', err)
    }
  }

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
    return Boolean(successful)
  } catch (err) {
    console.error('降级复制方案失败:', err)
    return false
  }
}
