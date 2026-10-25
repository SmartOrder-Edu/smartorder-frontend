<template>
  <div class="watercolor-orb" :style="orbStyle" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    color: string
    size?: number
    opacity?: number
    top?: string
    left?: string
    right?: string
    bottom?: string
  }>(),
  {
    size: 500,
    opacity: 0.4,
  }
)

const orbStyle = computed(() => ({
  background: props.color,
  width: `${props.size}px`,
  height: `${props.size}px`,
  opacity: props.opacity,
  top: props.top,
  left: props.left,
  right: props.right,
  bottom: props.bottom,
}))
</script>

<style scoped lang="scss">
.watercolor-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: orb-breathe 6s ease-in-out infinite;
}

@keyframes orb-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

html[data-theme='dark'] .watercolor-orb {
  filter: blur(80px) brightness(0.55);
}

@media (prefers-reduced-motion: reduce) {
  .watercolor-orb {
    animation: none;
  }
}
</style>
