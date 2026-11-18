// 轻量级通知提示工具（支持悬停暂停、进度条、手动关闭与最多 5 条堆叠限制）
const MAX_TOASTS = 5

const ICONS = {
  success: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  error: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
  warning: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
}

export const toast = {
  success(message, duration = 3000) {
    this.show(message, 'success', duration)
  },
  error(message, duration = 3500) {
    this.show(message, 'error', duration)
  },
  info(message, duration = 3000) {
    this.show(message, 'info', duration)
  },
  warning(message, duration = 3500) {
    this.show(message, 'warning', duration)
  },

  show(message, type = 'info', duration = 3000) {
    if (import.meta.server) return

    let container = document.querySelector('.toast-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'toast-container'
      container.setAttribute('aria-live', 'polite')
      document.body.appendChild(container)
    }

    // 超出上限时提前关闭最早的通知
    while (container.children.length >= MAX_TOASTS) {
      const oldest = container.firstElementChild
      if (!oldest) break
      oldest.remove()
    }

    const toastEl = document.createElement('div')
    toastEl.className = `toast toast-${type}`
    toastEl.style.setProperty('--toast-duration', `${duration}ms`)

    const iconWrap = document.createElement('div')
    iconWrap.className = 'toast-icon'
    iconWrap.innerHTML = ICONS[type] || ICONS.info

    // 使用 textContent 写入消息，避免消息中的文件名等内容被解析为 HTML（XSS）
    const messageEl = document.createElement('div')
    messageEl.className = 'toast-message'
    messageEl.textContent = String(message ?? '')

    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'toast-close'
    closeBtn.setAttribute('aria-label', '关闭通知')
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'

    const progressEl = document.createElement('div')
    progressEl.className = 'toast-progress'

    toastEl.appendChild(iconWrap)
    toastEl.appendChild(messageEl)
    toastEl.appendChild(closeBtn)
    toastEl.appendChild(progressEl)

    container.appendChild(toastEl)

    let remaining = duration
    let startTime = Date.now()
    let dismissTimer = null
    let dismissed = false

    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      clearTimeout(dismissTimer)
      toastEl.classList.add('hide')
      setTimeout(() => {
        toastEl.remove()
        if (container && container.children.length === 0) {
          container.remove()
        }
      }, 280)
    }

    const startTimer = () => {
      startTime = Date.now()
      clearTimeout(dismissTimer)
      dismissTimer = setTimeout(dismiss, remaining)
      toastEl.classList.remove('paused')
    }

    const pauseTimer = () => {
      clearTimeout(dismissTimer)
      remaining = Math.max(300, remaining - (Date.now() - startTime))
      toastEl.classList.add('paused')
    }

    closeBtn.addEventListener('click', dismiss)
    toastEl.addEventListener('mouseenter', pauseTimer)
    toastEl.addEventListener('mouseleave', startTimer)

    startTimer()
  }
}
