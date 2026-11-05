<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "@/store";
import PageContainer from "@/components/layout/PageContainer.vue";

const store = useStore();

const fallback = computed(() => store.uiConfig.fallback);

const isEnabled = computed({
  get: () => fallback.value.enabled,
  set: (val: boolean) => {
    fallback.value.enabled = val;
    store.markDirty();
  },
});

const timeoutMs = computed({
  get: () => fallback.value.timeoutMs,
  set: (val: number) => {
    fallback.value.timeoutMs = val;
    store.markDirty();
  },
});

const hostsText = computed({
  get: () => fallback.value.hosts.join("\n"),
  set: (val: string) => {
    fallback.value.hosts = val
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);
    store.markDirty();
  },
});

const validHostCount = computed(() => {
  return fallback.value.hosts.filter((h) => {
    return /^\[([^\]]+)\]:(\d+)$/.test(h) || /^([^:]+):(\d+)$/.test(h);
  }).length;
});

function clearHosts() {
  if (confirm("确定要清空回退地址池吗？")) {
    fallback.value.hosts = [];
    store.markDirty();
  }
}
</script>

<template>
  <PageContainer title="回退策略">
    <div class="space-y-4 max-w-4xl text-xs">
      <!-- 1. 核心开关与超时参数卡片 -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-4">
        <div
          class="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800">
          <div>
            <h3
              class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span
                class="i-mdi-shield-refresh-outline text-indigo-500 text-lg"></span>
              <span>首跳回退</span>
            </h3>
          </div>

          <!-- 启用滑块开关 -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              :aria-checked="isEnabled"
              @click="isEnabled = !isEnabled"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="
                isEnabled
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              "
              :title="isEnabled ? '已启用（点击停用）' : '已停用（点击启用）'">
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="isEnabled ? 'translate-x-4' : 'translate-x-0'" />
            </button>
            <span
              class="font-bold text-xs"
              :class="
                isEnabled
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400'
              ">
              {{ isEnabled ? "已启用" : "已停用" }}
            </span>
          </div>
        </div>

        <!-- 超时参数配置 -->
        <div>
          <div class="space-y-1">
            <label
              class="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
              超时时间:
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="timeoutMs"
                type="number"
                min="100"
                max="30000"
                step="100"
                placeholder="3500"
                class="w-36 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
              <span class="text-slate-400 text-xs">毫秒 (ms)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 兜底地址池多行纯文本编辑器 -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-slate-900 dark:text-slate-100">
              回退地址:
            </span>
            <span
              class="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold"
              :class="
                validHostCount > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              ">
              {{ validHostCount }} 个
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="fallback.hosts.length > 0"
              type="button"
              @click="clearHosts"
              class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-slate-500 hover:text-rose-600 text-xs font-semibold shadow-2xs transition-colors">
              清空
            </button>
          </div>
        </div>

        <!-- 纯文本多行编辑器 -->
        <div class="space-y-1">
          <textarea
            v-model="hostsText"
            rows="12"
            placeholder="IP:端口，例如 1.2.3.4:443"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs"></textarea>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
