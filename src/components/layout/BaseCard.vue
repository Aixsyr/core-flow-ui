<script setup lang="ts">
defineProps<{
  index: number;
  isExpanded: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-expand"): void;
  (e: "move-up"): void;
  (e: "move-down"): void;
  (e: "remove"): void;
}>();

function onHeaderClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // 排除输入框、下拉框、文本域、按钮、复选标签等交互元素，避免输入或点击下拉时误触折叠
  if (target.closest("input, select, textarea, button, label, a")) {
    return;
  }
  emit("toggle-expand");
}
</script>

<template>
  <div
    class="rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-400/80 dark:hover:border-slate-600 transition-all overflow-hidden"
    :class="{ 'opacity-60': disabled }">
    <!-- 统一标准行头 (Master Row) - 整行任意空白区域点击均可展开/折叠 -->
    <div
      class="px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5 select-none cursor-pointer border-b border-transparent transition-colors"
      :class="
        isExpanded
          ? 'bg-slate-50 dark:bg-slate-800/60 !border-slate-200 dark:!border-slate-800'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
      "
      @click="onHeaderClick">
      <!-- 左侧：序号 + 业务核心控件插槽 (移除阻断冒泡，允许点击间隙与空白处展开) -->
      <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <!-- 统一序号徽章 -->
        <span
          class="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold flex items-center justify-center shrink-0">
          {{ index + 1 }}
        </span>

        <!-- 业务控件主插槽 (名称输入、类型选择、关联导向、数据量徽标) -->
        <slot name="header" />
      </div>

      <!-- 右侧：标准操作按钮群 -->
      <div class="flex items-center gap-1 shrink-0" @click.stop>
        <!-- 前置附属控制（如启用开关） -->
        <slot name="actions-prefix" />

        <!-- 上移 -->
        <button
          type="button"
          @click="emit('move-up')"
          :disabled="canMoveUp === false || index === 0"
          class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
          title="上移">
          <span class="i-mdi-arrow-up text-xs"></span>
        </button>

        <!-- 下移 -->
        <button
          type="button"
          @click="emit('move-down')"
          :disabled="canMoveDown === false"
          class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
          title="下移">
          <span class="i-mdi-arrow-down text-xs"></span>
        </button>

        <!-- 删除 -->
        <button
          type="button"
          @click="emit('remove')"
          class="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
          title="删除">
          <span class="i-mdi-delete text-sm"></span>
        </button>

        <!-- 折叠/展开 -->
        <button
          type="button"
          @click="emit('toggle-expand')"
          class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform"
          :class="{ 'rotate-180': isExpanded }"
          title="折叠/展开">
          <span class="i-mdi-chevron-down text-sm"></span>
        </button>
      </div>
    </div>

    <!-- 展开内容主体 -->
    <div v-show="isExpanded" class="p-4 space-y-3.5 text-xs">
      <slot />
    </div>
  </div>
</template>
