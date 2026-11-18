<template>
  <div ref="containerRef" class="logo-particles-container">
    <canvas ref="canvas" class="logo-canvas" aria-hidden="true"></canvas>
    <div class="logo-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const containerRef = ref(null)
const canvas = ref(null)
let ctx = null
let animationFrameId = null
let resizeObserver = null
let particles = []
let prefersReducedMotion = false
let logicalWidth = 0
let logicalHeight = 0

class Pixel {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.init(true)
  }

  init(randomY = false) {
    this.x = Math.random() * this.w
    this.y = randomY ? Math.random() * this.h : this.h - 2
    this.size = Math.random() * 2 + 1
    this.speedY = -(Math.random() * 0.42 + 0.18)
    this.opacity = Math.random() * 0.5 + 0.2
    this.maxLife = Math.random() * 90 + 50
    this.life = this.maxLife
  }

  update() {
    this.y += this.speedY
    this.life--
    if (this.life <= 0 || this.y < -4) {
      this.init(false)
    }
  }

  draw(context) {
    context.fillStyle = '#00d4ff'
    context.globalAlpha = this.opacity * (this.life / this.maxLife)
    context.fillRect(this.x, this.y, this.size, this.size)
  }
}

const syncSize = () => {
  if (!containerRef.value || !canvas.value) return
  const rect = containerRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  logicalWidth = rect.width
  logicalHeight = rect.height
  canvas.value.width = Math.floor(logicalWidth * dpr)
  canvas.value.height = Math.floor(logicalHeight * dpr)
  ctx = canvas.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  particles = []
  for (let i = 0; i < 28; i++) {
    particles.push(new Pixel(logicalWidth, logicalHeight))
  }
}

const drawOnce = () => {
  if (!ctx || !logicalWidth || !logicalHeight) return
  ctx.clearRect(0, 0, logicalWidth, logicalHeight)
  for (const p of particles) {
    if (!prefersReducedMotion) p.update()
    p.draw(ctx)
  }
  ctx.globalAlpha = 1
}

const animate = () => {
  drawOnce()
  if (!prefersReducedMotion && !document.hidden) {
    animationFrameId = requestAnimationFrame(animate)
  } else {
    animationFrameId = null
  }
}

const startLoop = () => {
  if (prefersReducedMotion) {
    drawOnce()
    return
  }
  if (!animationFrameId && !document.hidden) {
    animationFrameId = requestAnimationFrame(animate)
  }
}

const stopLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopLoop()
  } else {
    startLoop()
  }
}

onMounted(() => {
  if (!import.meta.client || !containerRef.value) return
  prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  syncSize()
  startLoop()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      syncSize()
      drawOnce()
    })
    resizeObserver.observe(containerRef.value)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopLoop()
  resizeObserver?.disconnect()
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>

<style scoped>
.logo-particles-container {
  position: relative;
  padding: 4px 10px;
}

.logo-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.logo-content {
  position: relative;
  z-index: 1;
}
</style>
