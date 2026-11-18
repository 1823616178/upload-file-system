<template>
  <canvas ref="canvas" class="tech-particles" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let particles = []
let prefersReducedMotion = false
let resizeObserver = null
let time = 0

const mouse = { x: -9999, y: -9999, radius: 140 }

class Particle {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.init()
  }

  init() {
    this.originX = Math.random() * this.width
    this.originY = Math.random() * this.height
    this.x = this.originX
    this.y = this.originY
    this.size = Math.random() * 1.9 + 0.6
    this.density = Math.random() * 24 + 4
    this.color = Math.random() > 0.45 ? '#00d4ff' : '#0099ff'
    this.opacity = Math.random() * 0.45 + 0.2
    this.phase = Math.random() * Math.PI * 2
    this.speed = 0.008 + Math.random() * 0.01
    this.driftRadius = 8 + Math.random() * 14
  }

  draw(context) {
    // 大粒子使用轻量级外光晕圆替代高开销的 ctx.shadowBlur
    if (this.size > 1.75) {
      context.globalAlpha = this.opacity * 0.22
      context.fillStyle = this.color
      context.beginPath()
      context.arc(this.x, this.y, this.size * 3.2, 0, Math.PI * 2)
      context.fill()
    }

    context.globalAlpha = this.opacity
    context.fillStyle = this.color
    context.beginPath()
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    context.fill()
  }

  update(t) {
    const floatX = this.originX + Math.cos(t * this.speed + this.phase) * this.driftRadius
    const floatY = this.originY + Math.sin(t * this.speed * 0.9 + this.phase) * this.driftRadius

    const dx = mouse.x - this.x
    const dy = mouse.y - this.y
    const distSq = dx * dx + dy * dy
    const maxDistSq = mouse.radius * mouse.radius

    if (distSq > 0.01 && distSq < maxDistSq) {
      const distance = Math.sqrt(distSq)
      const force = (mouse.radius - distance) / mouse.radius
      const pushX = (dx / distance) * force * this.density
      const pushY = (dy / distance) * force * this.density
      this.x -= pushX * 0.16
      this.y -= pushY * 0.16
    } else {
      this.x += (floatX - this.x) * 0.08
      this.y += (floatY - this.y) * 0.08
    }
  }
}

const getParticleCount = (w, h) => {
  const area = w * h
  return Math.min(110, Math.max(40, Math.round(area / 16000)))
}

const initParticles = (width, height) => {
  const count = getParticleCount(width, height)
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(width, height))
  }
}

const drawFrame = () => {
  if (!canvas.value || !ctx) return
  const width = canvas.value.clientWidth || window.innerWidth
  const height = canvas.value.clientHeight || window.innerHeight

  ctx.clearRect(0, 0, width, height)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    if (!prefersReducedMotion) {
      p.update(time)
    }
    p.draw(ctx)
  }

  // 绘制邻近粒子的轻量连接线，增强数字网络氛围
  const linkDistSq = 105 * 105
  ctx.lineWidth = 0.6
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 < linkDistSq) {
        ctx.globalAlpha = (1 - d2 / linkDistSq) * 0.12
        ctx.strokeStyle = '#00d4ff'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
}

const animate = () => {
  time += 1
  drawFrame()
  if (!prefersReducedMotion && !document.hidden) {
    animationFrameId = requestAnimationFrame(animate)
  } else {
    animationFrameId = null
  }
}

const startLoop = () => {
  if (prefersReducedMotion) {
    drawFrame()
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

const handleResize = () => {
  if (!canvas.value) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.value.width = Math.floor(width * dpr)
  canvas.value.height = Math.floor(height * dpr)
  ctx = canvas.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  initParticles(width, height)
  drawFrame()
}

const handleMouseMove = (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

const handleMouseLeave = () => {
  mouse.x = -9999
  mouse.y = -9999
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopLoop()
  } else {
    startLoop()
  }
}

onMounted(() => {
  if (!import.meta.client || !canvas.value) return
  prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  handleResize()
  startLoop()
  window.addEventListener('resize', handleResize, { passive: true })
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('mouseleave', handleMouseLeave)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (!import.meta.client) return
  stopLoop()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.tech-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
}
</style>
