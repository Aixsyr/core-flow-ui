<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="min-h-full flex flex-col">
    <!-- 统一吸顶顶部操作栏 (高度固定 h-11，吸顶 backdrop 模糊) -->
    <header
      class="sticky top-0 z-20 h-11 px-4 sm:px-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
      <!-- 左侧：标题与副标题 -->
      <div class="flex items-center gap-3 shrink-0">
        <h2
          class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>{{ title }}</span>
        </h2>
        <span v-if="subtitle" class="text-slate-400 text-xs hidden lg:inline">
          {{ subtitle }}
        </span>
      </div>

      <!-- 右侧：页面自定义动作按钮插槽 -->
      <div class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <!-- 统一主内容居中约束区 -->
    <main class="flex-1 p-4 sm:p-5 max-w-7xl w-full mx-auto space-y-4">
      <slot />
    </main>
  </div>
</template>
