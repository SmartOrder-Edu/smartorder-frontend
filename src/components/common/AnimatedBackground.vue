<template>
  <div class="animated-background">
    <!-- 动态渐变背景 -->
    <div class="gradient-bg"></div>

    <!-- 主粒子效果 -->
    <div class="particles-container">
      <div
        v-for="i in 30"
        :key="`particle-${i}`"
        class="particle"
        :style="getParticleStyle(i)"
      ></div>
    </div>

    <!-- 浮动粒子 -->
    <div class="floating-particles">
      <div
        v-for="i in 15"
        :key="`float-${i}`"
        class="floating-particle"
        :style="getFloatingStyle(i)"
      ></div>
    </div>

    <!-- 星星粒子 -->
    <div class="star-particles">
      <div
        v-for="i in 20"
        :key="`star-${i}`"
        class="star-particle"
        :style="getStarStyle(i)"
      ></div>
    </div>

    <!-- 光晕效果 -->
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
    <div class="glow-orb glow-orb-4"></div>

    <!-- 连接线效果 -->
    <svg class="connections" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        v-for="i in 5"
        :key="`conn-${i}`"
        class="connection-line"
        :d="getConnectionPath(i)"
        :style="{ animationDelay: `${i * 0.5}s` }"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
const getParticleStyle = (index: number) => {
  const colors = [
    'rgba(139, 92, 246, 0.7)',  // 紫色
    'rgba(99, 102, 241, 0.7)',   // 靛蓝
    'rgba(59, 130, 246, 0.7)',   // 蓝色
    'rgba(236, 72, 153, 0.7)',   // 粉色
    'rgba(6, 182, 212, 0.7)'     // 青色
  ]

  return {
    left: `${(index * 7) % 98}%`,
    animationDelay: `${(index * 0.6) % 8}s`,
    animationDuration: `${10 + (index % 10)}s`,
    background: colors[index % colors.length],
    width: `${2 + (index % 5)}px`,
    height: `${2 + (index % 5)}px`,
    boxShadow: `0 0 ${4 + (index % 4)}px ${colors[index % colors.length]}`
  }
}

const getFloatingStyle = (index: number) => {
  return {
    left: `${(index * 13) % 95}%`,
    top: `${(index * 7) % 90}%`,
    animationDelay: `${(index * 0.4) % 6}s`,
    animationDuration: `${8 + (index % 7)}s`,
    width: `${3 + (index % 3)}px`,
    height: `${3 + (index % 3)}px`
  }
}

const getStarStyle = (index: number) => {
  return {
    left: `${(index * 9) % 97}%`,
    top: `${(index * 11) % 93}%`,
    animationDelay: `${(index * 0.3) % 5}s`,
    animationDuration: `${2 + (index % 3)}s`,
    width: `${2 + (index % 2)}px`,
    height: `${2 + (index % 2)}px`
  }
}

const getConnectionPath = (index: number) => {
  const paths = [
    'M10,20 Q30,10 50,30 T90,20',
    'M20,80 Q40,70 60,90 T80,70',
    'M5,50 Q25,40 45,60 T85,50',
    'M15,90 Q35,80 55,95 T95,85',
    'M30,10 Q50,20 70,15 T90,25'
  ]
  return paths[index % paths.length]
}
</script>

<style scoped>
.animated-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* 动态渐变背景 */
.gradient-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08), transparent),
    radial-gradient(ellipse 40% 30% at 90% 20%, rgba(236, 72, 153, 0.06), transparent),
    var(--bg-primary);
  animation: gradient-shift 30s ease-in-out infinite alternate;
}

@keyframes gradient-shift {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(25deg); }
}

/* 粒子容器 */
.particles-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* 粒子效果 */
.particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  opacity: 0;
  animation: float-up linear infinite;
  box-shadow: 0 0 10px currentColor;
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-110vh) scale(1);
    opacity: 0;
  }
}

/* 浮动粒子 */
.floating-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.floating-particle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(59, 130, 246, 0.6));
  animation: float-around ease-in-out infinite;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
}

@keyframes float-around {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-15px, 20px) scale(0.9);
  }
  75% {
    transform: translate(30px, 10px) scale(1.05);
  }
}

/* 星星粒子 */
.star-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.star-particle {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: star-twinkle ease-in-out infinite;
  box-shadow: 0 0 10px white, 0 0 20px rgba(139, 92, 246, 0.8);
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 光晕效果 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  animation: orb-float 20s ease-in-out infinite;
}

.glow-orb-1 {
  width: 500px;
  height: 500px;
  background: rgba(139, 92, 246, 0.5);
  top: 5%;
  left: 10%;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 400px;
  height: 400px;
  background: rgba(59, 130, 246, 0.4);
  top: 40%;
  right: 10%;
  animation-delay: -5s;
}

.glow-orb-3 {
  width: 350px;
  height: 350px;
  background: rgba(236, 72, 153, 0.35);
  bottom: 15%;
  left: 30%;
  animation-delay: -10s;
}

.glow-orb-4 {
  width: 300px;
  height: 300px;
  background: rgba(6, 182, 212, 0.3);
  top: 60%;
  left: 60%;
  animation-delay: -15s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(40px, -40px) scale(1.08);
  }
  50% {
    transform: translate(-30px, 30px) scale(0.92);
  }
  75% {
    transform: translate(50px, 20px) scale(1.05);
  }
}

/* 连接线效果 */
.connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.connection-line {
  fill: none;
  stroke: url(#connection-gradient);
  stroke-width: 0.3;
  opacity: 0.3;
  stroke-dasharray: 100;
  animation: line-draw 8s ease-in-out infinite;
}

@keyframes line-draw {
  0%, 100% {
    stroke-dashoffset: 100;
    opacity: 0.1;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 0.4;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .glow-orb-1 { width: 300px; height: 300px; }
  .glow-orb-2 { width: 250px; height: 250px; }
  .glow-orb-3 { width: 200px; height: 200px; }
  .glow-orb-4 { width: 180px; height: 180px; }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .gradient-bg,
  .particle,
  .floating-particle,
  .star-particle,
  .glow-orb,
  .connection-line {
    animation: none !important;
  }
}
</style>
