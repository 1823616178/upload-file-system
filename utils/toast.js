// Simple Toast Utility
export const toast = {
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  },
  error(message, duration = 3000) {
    this.show(message, 'error', duration);
  },
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  },
  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  },

  show(message, type = 'info', duration = 3000) {
    if (process.server) return;

    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    
    // Icon mapping
    const icons = {
      success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toastEl.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toastEl);

    // Auto remove
    setTimeout(() => {
      toastEl.classList.add('hide');
      setTimeout(() => {
        toastEl.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  }
};
