<template>
  <div
    class="companion-illustration"
    :class="[`size-${size}`, { float, 'with-delay': delay }]"
    :style="delay ? { animationDelay: delay } : null"
  >
    <img :src="src" :alt="alt" loading="lazy" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string
    alt?: string
    size?: 'hero' | 'md' | 'sm'
    float?: boolean
    /** 入场动画延迟，如 '0.2s' */
    delay?: string
  }>(),
  {
    size: 'md',
    float: false,
  }
)
</script>

<style scoped lang="scss">
.companion-illustration {
  display: inline-block;
  pointer-events: none;
  animation: companion-rise 0.8s var(--transition-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both;

  img {
    display: block;
    width: 100%;
    height: auto;
    filter: drop-shadow(0 18px 32px rgba(11, 183, 170, 0.18));
  }

  &.float img {
    animation: companion-float 4.5s ease-in-out 0.8s infinite;
  }

  &.with-delay {
    animation-delay: inherit;
  }
}

.size-hero {
  width: min(440px, 62vw);
}

.size-md {
  width: 260px;
}

.size-sm {
  width: 140px;
}

@keyframes companion-rise {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes companion-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

html[data-theme='dark'] .companion-illustration {
  filter: brightness(0.88) saturate(0.92);
  opacity: 0.92;
}

@media (prefers-reduced-motion: reduce) {
  .companion-illustration,
  .companion-illustration.float img {
    animation: none;
  }
}
</style>
