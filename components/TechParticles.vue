<template>
  <canvas ref="canvas" class="tech-particles"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let particles = []
const particleCount = 150
const mouse = { x: -100, y: -100, radius: 150 }

class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.init()
  }

  init() {
    this.x = Math.random() * this.canvasWidth
    this.y = Math.random() * this.canvasHeight
    this.size = Math.random() * 2 + 0.5
    this.baseX = this.x
    this.baseY = this.y
    this.density = (Math.random() * 30) + 1
    this.color = Math.random() > 0.5 ? '#00d4ff' : '#0099ff'
    this.opacity = Math.random() * 0.5 + 0.2
  }

  draw() {
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.opacity
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    
    // 给一些大粒子加发光
    if (this.size > 1.8) {
        ctx.shadowBlur = 10
        ctx.shadowColor = this.color
    } else {
        ctx.shadowBlur = 0
    }
  }

  update() {
    let dx = mouse.x - this.x
    let dy = mouse.y - this.y
    let distance = Math.sqrt(dx * dx + dy * dy)
    let forceDirectionX = dx / distance
    let forceDirectionY = dy / distance
    let maxDistance = mouse.radius
    let force = (maxDistance - distance) / maxDistance
    let directionX = forceDirectionX * force * this.density
    let directionY = forceDirectionY * force * this.density

    if (distance < mouse.radius) {
      this.x -= directionX
      this.y -= directionY
    } else {
      if (this.x !== this.baseX) {
        let dx = this.x - this.baseX
        this.x -= dx / 10
      }
      if (this.y !== this.baseY) {
        let dy = this.y - this.baseY
        this.y -= dy / 10
      }
    }
    
    // 微小漂浮动画
    this.baseX += (Math.random() - 0.5) * 0.2
    this.baseY += (Math.random() - 0.5) * 0.2
  }
}

const init = () => {
  particles = []
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(canvas.value.width, canvas.value.height))
  }
}

const animate = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  for (let i = 0; i < particles.length; i++) {
    particles[i].update()
    particles[i].draw()
  }
  animationFrameId = requestAnimationFrame(animate)
}

const handleResize = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  init()
}

const handleMouseMove = (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

onMounted(() => {
  if (process.client) {
    ctx = canvas.value.getContext('2d')
    handleResize()
    animate()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', handleMouseMove)
    cancelAnimationFrame(animationFrameId)
  }
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