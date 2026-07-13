<template>
  <canvas
    ref="canvasRef"
    class="particle-bg"
    :style="{ opacity: isReady ? 1 : 0 }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
const isReady = ref(false)

// --- Config ---
const TOTAL = 100
const CORE_COUNT = 25
const MOUSE_RADIUS = 200
const CONNECT_DISTANCE = 180
const LINE_OPACITY_MAX = 0.22
const REPULSION_STRENGTH = 2.0
const BASE_SPEED = 0.35

// Colors
const COLORS = [
  { r: 11, g: 183, b: 170 },  // mint
  { r: 20, g: 184, b: 166 },  // teal
  { r: 6, g: 182, b: 196 },   // cyan
  { r: 45, g: 212, b: 191 },  // light mint
  { r: 94, g: 234, b: 212 },  // pale mint
  { r: 52, g: 211, b: 153 },  // emerald
  { r: 129, g: 140, b: 248 }, // soft indigo
  { r: 196, g: 181, b: 253 }, // lavender
  { r: 251, g: 191, b: 36 },  // amber
  { r: 244, g: 114, b: 182 }, // pink
]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  baseR: number
  isCore: boolean
  color: (typeof COLORS)[number]
  phase: number
  brightness: number
}

let particles: Particle[] = []
let w = 0
let h = 0
let animId = 0
let resizeObserver: ResizeObserver | null = null

// Mouse state
let mouseX = -999
let mouseY = -999
let targetMouseX = -999
let targetMouseY = -999

function createParticles(): Particle[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const isCore = i < CORE_COUNT
    const baseR = isCore ? Math.random() * 2.5 + 3.0 : Math.random() * 1.2 + 1.5
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * BASE_SPEED,
      vy: (Math.random() - 0.5) * BASE_SPEED,
      r: baseR,
      baseR,
      isCore,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      brightness: 0,
    }
  })
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  targetMouseX = e.clientX - rect.left
  targetMouseY = e.clientY - rect.top
}

function onMouseLeave() {
  targetMouseX = -999
  targetMouseY = -999
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  const rect = parent.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  w = rect.width
  h = rect.height
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles = createParticles()
  if (!isReady.value) {
    requestAnimationFrame(() => { isReady.value = true })
  }
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: (typeof COLORS)[number], alpha: number) {
  const radius = r * 8
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
  grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`)
  grad.addColorStop(0.15, `rgba(${color.r},${color.g},${color.b},${alpha * 0.6})`)
  grad.addColorStop(0.4, `rgba(${color.r},${color.g},${color.b},${alpha * 0.15})`)
  grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
}

function draw(timestamp: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, w, h)

  // Smooth mouse position
  mouseX += (targetMouseX - mouseX) * 0.1
  mouseY += (targetMouseY - mouseY) * 0.1

  const mouseActive = targetMouseX > -999 && targetMouseY > -999

  // Update & draw particles
  for (const p of particles) {
    const t = timestamp * 0.001

    // Breathing animation
    const breathe = p.isCore ? 1 + Math.sin(t * 1.2 + p.phase) * 0.3 : 1 + Math.sin(t * 0.8 + p.phase) * 0.15
    p.r = p.baseR * breathe

    // Mouse repulsion
    let distToMouse = Infinity
    if (mouseActive) {
      const dx = p.x - mouseX
      const dy = p.y - mouseY
      distToMouse = Math.sqrt(dx * dx + dy * dy)

      if (distToMouse < MOUSE_RADIUS) {
        const force = (1 - distToMouse / MOUSE_RADIUS) * REPULSION_STRENGTH
        const angle = Math.atan2(dy, dx)
        p.vx += Math.cos(angle) * force * 0.1
        p.vy += Math.sin(angle) * force * 0.1
        p.brightness = Math.max(p.brightness, 1 - distToMouse / MOUSE_RADIUS)
      }
    }

    // Apply velocity
    p.x += p.vx
    p.y += p.vy

    // Damping
    p.vx *= 0.997
    p.vy *= 0.997

    // Wrap around edges
    if (p.x < -30) p.x = w + 30
    if (p.x > w + 30) p.x = -30
    if (p.y < -30) p.y = h + 30
    if (p.y > h + 30) p.y = -30

    // Decay brightness
    p.brightness *= 0.94

    // Draw particle
    const baseAlpha = p.isCore ? 0.75 : 0.45
    const alpha = Math.min(baseAlpha + p.brightness * 0.25, 1)
    const { color } = p

    // Glow on all particles
    drawGlow(ctx, p.x, p.y, p.r, color, alpha * 0.5)

    // Solid core
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`
    ctx.fill()
  }

  // Draw connections
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < CONNECT_DISTANCE) {
        let opacity = (1 - dist / CONNECT_DISTANCE) * LINE_OPACITY_MAX

        const boost = Math.max(a.brightness, b.brightness) * 0.3
        opacity = Math.min(opacity + boost, 0.4)

        const lineWidth = 0.6 + boost * 2.0

        const useColor = boost > 0.05 ? COLORS[0] : a.color

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(${useColor.r},${useColor.g},${useColor.b},${opacity})`
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }
    }
  }

  // Mouse glow ring
  if (mouseActive && targetMouseX > -999) {
    const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 160)
    grad.addColorStop(0, 'rgba(11, 183, 170, 0.06)')
    grad.addColorStop(0.5, 'rgba(11, 183, 170, 0.03)')
    grad.addColorStop(1, 'rgba(11, 183, 170, 0)')
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 160, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  animId = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  animId = requestAnimationFrame(draw)

  const canvas = canvasRef.value
  const parent = canvas?.parentElement
  if (parent) {
    parent.addEventListener('mousemove', onMouseMove, { passive: true })
    parent.addEventListener('mouseleave', onMouseLeave)
    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(parent)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  resizeObserver?.disconnect()
  const canvas = canvasRef.value
  const parent = canvas?.parentElement
  if (parent) {
    parent.removeEventListener('mousemove', onMouseMove)
    parent.removeEventListener('mouseleave', onMouseLeave)
  }
})
</script>

<style scoped>
.particle-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.8s ease;
}
</style>