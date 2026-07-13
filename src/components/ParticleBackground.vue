<template>
  <canvas ref="canvasRef" class="particle-bg" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()

// ======================== Config ========================
const PARTICLE_COUNT = 80
const HUB_COUNT = 6
const ORB_COUNT = 4
const MOUSE_RADIUS = 250
const MOUSE_INNER = 50
const CONNECT_DISTANCE = 180
const LINE_ALPHA_MAX = 0.2
const MAX_SPARKS = 40

// prettier-ignore
const COLORS = [
  { r: 11,  g: 183, b: 170 }, // mint
  { r: 6,   g: 182, b: 196 }, // cyan
  { r: 52,  g: 211, b: 153 }, // emerald
  { r: 45,  g: 212, b: 191 }, // light mint
  { r: 129, g: 140, b: 248 }, // soft indigo
  { r: 196, g: 181, b: 253 }, // lavender
  { r: 251, g: 191, b: 36  }, // amber
  { r: 244, g: 114, b: 182 }, // pink
]

const ORB_COLORS = [
  { r: 11,  g: 183, b: 170 },
  { r: 6,   g: 182, b: 196 },
  { r: 129, g: 140, b: 248 },
  { r: 251, g: 191, b: 36  },
]

// ======================== Types ========================
interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; baseR: number
  isHub: boolean
  color: (typeof COLORS)[number]
  phase: number
  brightness: number
}

interface Orb {
  x: number; y: number
  baseX: number; baseY: number
  radius: number
  color: (typeof COLORS)[number]
  vx: number; vy: number
  amp: number; phase: number; period: number
}

interface Spark {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number
  r: number
  color: (typeof COLORS)[number]
}

interface Pulse {
  from: Particle; to: Particle
  progress: number
  speed: number
  color: (typeof COLORS)[number]
}

// ======================== State ========================
let particles: Particle[] = []
let orbs: Orb[] = []
let sparks: Spark[] = []
let pulses: Pulse[] = []
let w = 0
let h = 0
let animId = 0
let lastSpawn = 0

let mouseX = -999
let mouseY = -999
let targetMouseX = -999
let targetMouseY = -999
let prevMouseX = -999
let prevMouseY = -999

// ======================== Init ========================
function createOrbs(): Orb[] {
  return ORB_COLORS.map((color, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    baseX: Math.random() * w,
    baseY: Math.random() * h,
    radius: 180 + Math.random() * 220,
    color,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    amp: 60 + Math.random() * 120,
    phase: Math.random() * Math.PI * 2,
    period: 8 + Math.random() * 12,
  }))
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const isHub = i < HUB_COUNT
    const baseR = isHub ? 3.5 + Math.random() * 2.5 : 1.8 + Math.random() * 1.8
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      r: baseR, baseR,
      isHub,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      brightness: 0,
    }
  })
}

function spawnSparks(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.5 + Math.random() * 2.5
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 0.6 + Math.random() * 0.8,
      r: 0.8 + Math.random() * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })
  }
  // Cap sparks
  if (sparks.length > MAX_SPARKS) {
    sparks = sparks.slice(-MAX_SPARKS)
  }
}

// ======================== Events ========================
function onMouseMove(e: MouseEvent) {
  prevMouseX = targetMouseX
  prevMouseY = targetMouseY
  targetMouseX = e.clientX
  targetMouseY = e.clientY
}

function onMouseLeave() {
  targetMouseX = -999
  targetMouseY = -999
}

function onResize() {
  w = window.innerWidth
  h = window.innerHeight
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  orbs = createOrbs()
  particles = createParticles()
}

// ======================== Drawing ========================
function drawOrb(ctx: CanvasRenderingContext2D, orb: Orb, t: number) {
  const ox = orb.baseX + Math.cos(t / orb.period + orb.phase) * orb.amp
  const oy = orb.baseY + Math.sin(t / orb.period * 0.7 + orb.phase) * orb.amp * 0.7
  orb.x += (ox - orb.x) * 0.02
  orb.y += (oy - orb.y) * 0.02

  // Keep in bounds
  orb.baseX += orb.vx
  orb.baseY += orb.vy
  if (orb.baseX < -orb.radius) orb.baseX = w + orb.radius
  if (orb.baseX > w + orb.radius) orb.baseX = -orb.radius
  if (orb.baseY < -orb.radius) orb.baseY = h + orb.radius
  if (orb.baseY > h + orb.radius) orb.baseY = -orb.radius

  const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
  const { color } = orb
  grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.07)`)
  grad.addColorStop(0.3, `rgba(${color.r},${color.g},${color.b},0.04)`)
  grad.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},0.015)`)
  grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
  ctx.beginPath()
  ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: (typeof COLORS)[number], alpha: number) {
  const radius = r * 10
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
  grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`)
  grad.addColorStop(0.1, `rgba(${color.r},${color.g},${color.b},${alpha * 0.5})`)
  grad.addColorStop(0.3, `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`)
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

  const t = timestamp * 0.001
  ctx.clearRect(0, 0, w, h)

  // --- Mouse smoothing ---
  mouseX += (targetMouseX - mouseX) * 0.12
  mouseY += (targetMouseY - mouseY) * 0.12

  const mouseActive = targetMouseX > -999
  const mouseSpeed = Math.hypot(targetMouseX - prevMouseX, targetMouseY - prevMouseY)

  // Spawn sparks on fast mouse movement
  if (mouseActive && mouseSpeed > 3 && timestamp - lastSpawn > 30) {
    spawnSparks(mouseX, mouseY, Math.min(Math.floor(mouseSpeed / 4), 3))
    lastSpawn = timestamp
  }

  // --- Draw orbs ---
  for (const orb of orbs) {
    drawOrb(ctx, orb, t)
  }

  // --- Update & draw particles ---
  for (const p of particles) {
    const breathe = p.isHub
      ? 1 + Math.sin(t * 1.0 + p.phase) * 0.35
      : 1 + Math.sin(t * 0.7 + p.phase) * 0.2
    p.r = p.baseR * breathe

    // Mouse interaction: attract toward mouse, push away when too close
    if (mouseActive) {
      const dx = mouseX - p.x
      const dy = mouseY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < MOUSE_RADIUS && dist > 1) {
        const nx = dx / dist
        const ny = dy / dist

        if (dist > MOUSE_INNER) {
          // Attract
          const force = (1 - (dist - MOUSE_INNER) / (MOUSE_RADIUS - MOUSE_INNER)) * 0.04
          p.vx += nx * force
          p.vy += ny * force
        } else {
          // Repel when too close
          const force = (1 - dist / MOUSE_INNER) * 0.06
          p.vx -= nx * force
          p.vy -= ny * force
        }
        p.brightness = Math.max(p.brightness, 1 - dist / MOUSE_RADIUS)
      }
    }

    p.x += p.vx
    p.y += p.vy

    // --- Autonomous movement ---
    // Subtle Brownian jitter — very small, just for organic micro-motion
    p.vx += (Math.random() - 0.5) * 0.003
    p.vy += (Math.random() - 0.5) * 0.003

    // All non-hub particles orbit around their nearest hub
    if (!p.isHub) {
      let closestHub: Particle | null = null
      let closestDist = 600
      for (let k = 0; k < HUB_COUNT; k++) {
        const hub = particles[k]
        const hdx = hub.x - p.x
        const hdy = hub.y - p.y
        const hdist = Math.sqrt(hdx * hdx + hdy * hdy)
        if (hdist < closestDist) { closestDist = hdist; closestHub = hub }
      }
      if (closestHub && closestDist > 1) {
        // Variable pull: gentle when close, stronger when drifting away
        const pull = closestDist > 250 ? 0.008 : closestDist > 120 ? 0.004 : 0.0015
        p.vx += ((closestHub!.x - p.x) / closestDist) * pull
        p.vy += ((closestHub!.y - p.y) / closestDist) * pull
      }
    }

    // Light damping
    p.vx *= 0.998
    p.vy *= 0.998

    // Speed clamping
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const minSpeed = p.isHub ? 0.08 : 0.1
    const maxSpeed = 0.45
    if (speed > 0) {
      if (speed < minSpeed) {
        const boost = minSpeed / speed
        p.vx *= boost
        p.vy *= boost
      } else if (speed > maxSpeed) {
        const cap = maxSpeed / speed
        p.vx *= cap
        p.vy *= cap
      }
    }

    // Wrap
    if (p.x < -40) p.x = w + 40
    if (p.x > w + 40) p.x = -40
    if (p.y < -40) p.y = h + 40
    if (p.y > h + 40) p.y = -40

    p.brightness *= 0.93

    // Draw glow
    const alpha = p.isHub ? 0.8 + p.brightness * 0.2 : 0.5 + p.brightness * 0.3
    drawGlow(ctx, p.x, p.y, p.r, p.color, alpha * 0.6)

    // Solid core
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${Math.min(alpha, 1)})`
    ctx.fill()
  }

  // --- Draw connections ---
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < CONNECT_DISTANCE) {
        let opacity = (1 - dist / CONNECT_DISTANCE) * LINE_ALPHA_MAX
        const boost = Math.max(a.brightness, b.brightness) * 0.35
        opacity = Math.min(opacity + boost, 0.45)

        const lw = 0.5 + boost * 2.5
        const lineColor = boost > 0.03 ? COLORS[0] : a.color

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(${lineColor.r},${lineColor.g},${lineColor.b},${opacity})`
        ctx.lineWidth = lw
        ctx.stroke()
      }
    }
  }

  // --- Draw pulses on hub-to-hub connections ---
  // Periodically create new pulses
  if (Math.random() < 0.02) {
    const hubs = particles.filter(p => p.isHub)
    if (hubs.length >= 2) {
      const a = hubs[Math.floor(Math.random() * hubs.length)]
      let b: Particle
      do { b = hubs[Math.floor(Math.random() * hubs.length)] } while (b === a)
      pulses.push({
        from: a, to: b,
        progress: 0,
        speed: 0.003 + Math.random() * 0.006,
        color: COLORS[Math.floor(Math.random() * 4)], // mint-family only
      })
    }
  }
  // Cap pulses
  if (pulses.length > 12) pulses = pulses.slice(-12)

  // Draw & update pulses
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i]
    p.progress += p.speed
    if (p.progress >= 1) {
      pulses.splice(i, 1)
      continue
    }
    const px = p.from.x + (p.to.x - p.from.x) * p.progress
    const py = p.from.y + (p.to.y - p.from.y) * p.progress

    // Glow dot
    const pg = ctx.createRadialGradient(px, py, 0, px, py, 12)
    pg.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},0.9)`)
    pg.addColorStop(0.3, `rgba(${p.color.r},${p.color.g},${p.color.b},0.4)`)
    pg.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`)
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fillStyle = pg
    ctx.fill()
  }

  // --- Draw & update sparks ---
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.x += s.vx
    s.y += s.vy
    s.vx *= 0.96
    s.vy *= 0.96
    s.life -= 1 / (s.maxLife * 60)

    if (s.life <= 0) {
      sparks.splice(i, 1)
      continue
    }

    const alpha = s.life * 0.8
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${alpha})`
    ctx.fill()
  }

  // --- Mouse cursor glow ---
  if (mouseActive) {
    const mg = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 180)
    mg.addColorStop(0, 'rgba(11, 183, 170, 0.08)')
    mg.addColorStop(0.4, 'rgba(11, 183, 170, 0.03)')
    mg.addColorStop(1, 'rgba(11, 183, 170, 0)')
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2)
    ctx.fillStyle = mg
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