<template>
  <div class="section-skeleton" :style="{ height: height }">
    <!-- 标题行骨架 -->
    <div class="skeleton-title" v-if="showTitle" />
    <!-- 内容骨架行 -->
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-row"
      :style="{ width: rowWidths[(i - 1) % rowWidths.length] }"
    />
    <!-- 底部区域骨架 -->
    <div class="skeleton-footer" v-if="showFooter" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    showTitle?: boolean
    showFooter?: boolean
    height?: string
    rowWidths?: string[]
  }>(),
  {
    rows: 3,
    showTitle: true,
    showFooter: false,
    height: '100%',
    rowWidths: () => ['85%', '60%', '75%'],
  }
)
</script>

<style scoped lang="scss">
.section-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
  min-height: 160px;
}

.skeleton-title {
  height: 18px;
  width: 40%;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--skeleton-bg-start, #edf1f7) 25%,
    var(--skeleton-bg-middle, #e4e9f2) 50%,
    var(--skeleton-bg-start, #edf1f7) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-row {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--skeleton-bg-start, #edf1f7) 25%,
    var(--skeleton-bg-middle, #e4e9f2) 50%,
    var(--skeleton-bg-start, #edf1f7) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-footer {
  height: 36px;
  width: 30%;
  border-radius: 6px;
  margin-top: 8px;
  background: linear-gradient(
    90deg,
    var(--skeleton-bg-start, #edf1f7) 25%,
    var(--skeleton-bg-middle, #e4e9f2) 50%,
    var(--skeleton-bg-start, #edf1f7) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
