<template>
  <div class="logo-particles-container">
    <canvas ref="canvas" class="logo-canvas"></canvas>
    <div class="logo-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let particles = []

class Pixel {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.init()
  }

  init() {
    this.x = Math.random() * this.w
    this.y = Math.random() * this.h
    this.size = Math.random() * 2 + 1
    this.speedY = -(Math.random() * 0.5 + 0.2)
    this.opacity = Math.random() * 0.6 + 0.2
    this.life = Math.random() * 100 + 50
  }

  update() {
    this.y += this.speedY
    this.life--
    if (this.life <= 0) {
      this.init()
      this.y = this.h - 5 // 从底部重新开始
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#00d4ff'
    ctx.globalAlpha = this.opacity * (this.life / 150)
    ctx.fillRect(this.x, this.y, this.size, this.size) // 方块像素感更强
  }
}

const animate = () => {
  if (!canvas.value) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(p => {
    p.update()
    p.draw(ctx)
  })

  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (process.client) {
    const container = canvas.value.parentElement
    canvas.value.width = container.offsetWidth + 60
    canvas.value.height = container.offsetHeight + 20
    ctx = canvas.value.getContext('2d')

    for(let i = 0; i < 40; i++) {
      particles.push(new Pixel(canvas.value.width, canvas.value.height))
    }

    animate()
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.logo-particles-container {
  position: relative;
  padding: 5px 15px;
}

.logo-canvas {
  position: absolute;
  top: 0;
  left: 0;
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