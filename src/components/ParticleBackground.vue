<template>
  <canvas ref="canvasRef" class="particle-bg" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()

// ======================== Config ========================
const CONNECT_DIST = 160
const MOUSE_RADIUS = 180

const PALETTE = [
  [11, 183, 170],   // mint
  [6, 182, 196],    // cyan
  [52, 211, 153],   // emerald
  [129, 140, 248],  // soft indigo
  [196, 181, 253],  // lavender
  [251, 191, 36],   // amber
  [244, 114, 182],  // pink
  [56, 189, 248],   // sky
]

// ======================== State ========================
interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: number[]  // [r, g, b]
}
let particles: Particle[] = []
let w = 0
let h = 0
let animId = 0
let mouseX = -9999
let mouseY = -9999

// ======================== Init ========================
function createParticles(): Particle[] {
  // Scale count by screen area — ~1 particle per 12,000 px²
  const area = w * h
  const count = Math.max(40, Math.min(120, Math.floor(area / 12000)))

  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  }))
}

// ======================== Events ========================
function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX
  mouseY = e.clientY
}
function onMouseLeave() {
  mouseX = -9999
  mouseY = -9999
}
function onResize() {
  w = window.innerWidth
  h = window.innerHeight
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles = createParticles()
}

// ======================== Loop ========================
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, w, h)

  const mouseActive = mouseX > -999
  const count = particles.length

  // --- Spatial grid for fast neighbor lookup ---
  // O(n) connection drawing instead of O(n²)
  const cellSize = CONNECT_DIST
  const cols = Math.ceil(w / cellSize)
  const rows = Math.ceil(h / cellSize)
  const grid: number[][] = Array.from({ length: cols * rows }, () => [])

  for (let i = 0; i < count; i++) {
    const p = particles[i]
    const col = Math.floor(p.x / cellSize)
    const row = Math.floor(p.y / cellSize)
    const idx = row * cols + col
    if (idx >= 0 && idx < grid.length) {
      grid[idx].push(i)
    }
  }

  // --- Update particles ---
  for (let i = 0; i < count; i++) {
    const p = particles[i]

    // Mouse attraction
    if (mouseActive) {
      const dx = mouseX - p.x
      const dy = mouseY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MOUSE_RADIUS && dist > 1) {
        const force = (1 - dist / MOUSE_RADIUS) * 0.04
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
      }
    }

    // Move
    p.x += p.vx
    p.y += p.vy

    // Damping
    p.vx *= 0.999
    p.vy *= 0.999

    // Speed clamping — keep gentle
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const minS = 0.15
    const maxS = 0.6
    if (speed > 0) {
      if (speed < minS) {
        const boost = minS / speed
        p.vx *= boost
        p.vy *= boost
      } else if (speed > maxS) {
        const cap = maxS / speed
        p.vx *= cap
        p.vy *= cap
      }
    }

    // Wrap around edges
    if (p.x < -20) p.x = w + 20
    if (p.x > w + 20) p.x = -20
    if (p.y < -20) p.y = h + 20
    if (p.y > h + 20) p.y = -20
  }

  // --- Draw connections (spatial-grid optimized) ---
  for (let ci = 0; ci < grid.length; ci++) {
    const cell = grid[ci]
    if (cell.length === 0) continue

    // Check current cell + right/down-right/down neighbors only
    const neighbors = [
      ci,                          // same cell
      ci + 1,                       // right
      ci + cols,                    // down
      ci + cols + 1,               // down-right
    ]

    for (const ni of neighbors) {
      if (ni < 0 || ni >= grid.length) continue
      const neighborCell = grid[ni]

      for (let a = 0; a < cell.length; a++) {
        const i = cell[a]
        const pi = particles[i]

        // For same cell, start from a+1 to avoid duplicate pairs
        const startJ = ni === ci ? a + 1 : 0
        for (let b = startJ; b < neighborCell.length; b++) {
          const j = neighborCell[b]
          const pj = particles[j]

          const dx = pi.x - pj.x
          const dy = pi.y - pj.y
          const dist = dx * dx + dy * dy // squared distance

          if (dist < CONNECT_DIST * CONNECT_DIST) {
            const realDist = Math.sqrt(dist)
            const alpha = (1 - realDist / CONNECT_DIST) * 0.28
            // Blend the two particle colors
            const cr = Math.round((pi.color[0] + pj.color[0]) / 2)
            const cg = Math.round((pi.color[1] + pj.color[1]) / 2)
            const cb = Math.round((pi.color[2] + pj.color[2]) / 2)
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
    }
  }

  // --- Draw particles ---
  for (let i = 0; i < count; i++) {
    const p = particles[i]
    const [r, g, b] = p.color
    // Subtle glow
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4)
    glow.addColorStop(0, `rgba(${r},${g},${b},0.7)`)
    glow.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`)
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()
    // Solid core
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},0.8)`
    ctx.fill()
  }

  animId = requestAnimationFrame(draw)
}

// ======================== Lifecycle ========================
onMounted(() => {
  onResize()
  animId = requestAnimationFrame(draw)
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.particle-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
