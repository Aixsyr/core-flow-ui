<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useStore } from "@/store";
import PageContainer from "@/components/layout/PageContainer.vue";

const store = useStore();

const yamlContent = ref("");
const isLoading = ref(false);
const searchQuery = ref("");
const copySuccess = ref(false);

const stats = computed(() => {
  if (!yamlContent.value) return { lines: 0, bytes: "0 B" };
  const lines = yamlContent.value.split("\n").length;
  const bytes = new Blob([yamlContent.value]).size;
  return {
    lines,
    bytes: bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`,
  };
});

const filteredLines = computed(() => {
  if (!yamlContent.value) return [];
  const lines = yamlContent.value.split("\n");
  if (!searchQuery.value.trim()) {
    return lines.map((text, idx) => ({
      lineNum: idx + 1,
      text,
      highlight: false,
    }));
  }
  const q = searchQuery.value.toLowerCase();
  return lines.map((text, idx) => ({
    lineNum: idx + 1,
    text,
    highlight: text.toLowerCase().includes(q),
  }));
});

const matchCount = computed(() => {
  if (!searchQuery.value.trim()) return 0;
  return filteredLines.value.filter((l) => l.highlight).length;
});

async function fetchYaml() {
  if (!store.isConnected) return;
  isLoading.value = true;
  try {
    yamlContent.value = await store.previewProfile();
  } catch (err: any) {
    store.showToast(err.message || "拉取 YAML 失败", "error");
  } finally {
    isLoading.value = false;
  }
}

function copyAll() {
  if (!yamlContent.value) return;
  navigator.clipboard.writeText(yamlContent.value);
  copySuccess.value = true;
  store.showToast("已成功复制全部配置内容", "success");
  setTimeout(() => (copySuccess.value = false), 2000);
}

function downloadYaml() {
  if (!yamlContent.value) return;
  const blob = new Blob([yamlContent.value], {
    type: "text/yaml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `profile-${new Date().toISOString().slice(0, 10)}.yaml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  store.showToast("已导出并下载 YAML 配置文件", "success");
}

onMounted(() => {
  if (store.isConnected) {
    fetchYaml();
  }
});

defineExpose({
  fetchYaml,
  downloadYaml,
  copyAll,
});
</script>

<template>
  <PageContainer title="配置预览">
    <template #actions>
      <button
        type="button"
        @click="fetchYaml"
        :disabled="isLoading || !store.isConnected"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40">
        <span
          class="i-mdi-refresh"
          :class="{ 'animate-spin': isLoading }"></span>
        <span>刷新</span>
      </button>

      <button
        type="button"
        @click="copyAll"
        :disabled="!yamlContent || isLoading"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40">
        <span
          :class="
            copySuccess ? 'i-mdi-check text-emerald-500' : 'i-mdi-content-copy'
          "></span>
        <span>{{ copySuccess ? "已复制" : "复制" }}</span>
      </button>

      <button
        type="button"
        @click="downloadYaml"
        :disabled="!yamlContent || isLoading"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40">
        <span class="i-mdi-download-outline"></span>
        <span>导出</span>
      </button>
    </template>

    <div class="space-y-3.5 text-xs">
      <!-- 未连接提示 -->
      <div
        v-if="!store.isConnected"
        class="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <span
          class="i-mdi-link-variant-off text-3xl block mx-auto text-slate-400"></span>
        <p class="font-medium text-slate-600 dark:text-slate-300">尚未连接至 Worker</p>
      </div>

      <!-- 加载中 -->
      <div
        v-else-if="isLoading"
        class="p-16 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <span
          class="i-svg-spinners-90-ring-with-bg text-3xl text-indigo-500 block mx-auto"></span>
        <p class="text-xs text-slate-400">正在获取最新配置...</p>
      </div>

      <!-- YAML 视图主体 -->
      <div
        v-else
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <!-- 搜索栏与概览状态 -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs">
          <div class="flex items-center gap-3">
            <div class="relative w-64">
              <span
                class="i-mdi-magnify absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"></span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索配置内容..."
                class="w-full pl-8 pr-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-700 dark:text-slate-200 shadow-2xs" />
            </div>
            <span v-if="searchQuery" class="text-slate-400 text-[11px]">
              匹配到
              <strong class="text-indigo-500">{{ matchCount }}</strong> 处
            </span>
          </div>

          <div
            class="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>总行数: {{ stats.lines }}</span>
            <span>文件大小: {{ stats.bytes }}</span>
          </div>
        </div>

        <!-- 代码渲染容器 -->
        <div
          class="max-h-[640px] overflow-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed select-text p-4">
          <div
            v-for="item in filteredLines"
            :key="item.lineNum"
            class="flex gap-4 hover:bg-slate-900/60 px-1 py-0.5 rounded transition-colors"
            :class="{ 'bg-amber-500/20 text-amber-200': item.highlight }">
            <span
              class="w-10 shrink-0 text-right text-slate-600 select-none text-[11px]">
              {{ item.lineNum }}
            </span>
            <span class="whitespace-pre flex-1">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
