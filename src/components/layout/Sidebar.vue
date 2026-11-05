<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useStore } from "@/store";

const store = useStore();
const emit = defineEmits<{
  (e: "open-connect"): void;
}>();

const isCopied = ref(false);

function copyProfile() {
  if (!store.profileUrl) return;
  navigator.clipboard.writeText(store.profileUrl);
  isCopied.value = true;
  store.showToast("配置链接已复制", "success");
  setTimeout(() => (isCopied.value = false), 2000);
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (store.isConnected && !store.isLoading) {
      store.saveConfig();
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

const navItems = [
  {
    id: "endpoints",
    label: "节点组",
    icon: "i-mdi-server-network",
    countKey: "endpoints",
  },
  {
    id: "policies",
    label: "策略组",
    icon: "i-mdi-layers-triple-outline",
    countKey: "policies",
  },
  {
    id: "filters",
    label: "分流规则",
    icon: "i-mdi-routes",
    countKey: "filters",
  },
  {
    id: "fallback",
    label: "回退策略",
    icon: "i-mdi-shield-refresh-outline",
    countKey: "fallback",
  },
  {
    id: "preview",
    label: "配置预览",
    icon: "i-mdi-file-code-outline",
    countKey: null,
  },
] as const;

function getItemCount(
  key: "endpoints" | "policies" | "filters" | "fallback" | null,
): string | number | null {
  if (!key) return null;
  if (key === "fallback") {
    return store.uiConfig.fallback?.enabled ? "ON" : "OFF";
  }
  return store.uiConfig[key]?.length || 0;
}
</script>

<template>
  <aside
    class="w-60 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between z-30 select-none shadow-2xs">
    <!-- 上半部：Logo 与主导航 -->
    <div class="flex flex-col">
      <!-- 品牌 Logo 栏 -->
      <div
        class="h-14 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20">
            <span class="i-mdi-tune-variant text-base"></span>
          </div>
          <div>
            <span
              class="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
              Core Flow
            </span>
            <span
              class="text-[10px] text-slate-400 font-mono block leading-tight">
              Control Panel
            </span>
          </div>
        </div>

        <!-- 在线状态点 -->
        <span
          class="w-2.5 h-2.5 rounded-full"
          :class="
            store.isConnected
              ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-rose-500 ring-2 ring-rose-500/20'
          "
          :title="store.isConnected ? 'Worker 在线' : '未连接 Worker'"></span>
      </div>

      <!-- 导航列表 -->
      <nav class="p-3 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          @click="store.activeTab = item.id"
          class="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
          :class="
            store.activeTab === item.id
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
          ">
          <div class="flex items-center gap-2.5">
            <span :class="item.icon" class="text-base shrink-0"></span>
            <span>{{ item.label }}</span>
          </div>

          <span
            v-if="getItemCount(item.countKey) !== null"
            class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
            :class="
              store.activeTab === item.id
                ? 'bg-white/20 text-white'
                : 'bg-slate-150 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            ">
            {{ getItemCount(item.countKey) }}
          </span>
        </button>
      </nav>
    </div>

    <!-- 下半部：全局保存与同步、配置快速复制与连接配置 -->
    <div class="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
      <!-- 全局保存与同步操作区 -->
      <div v-if="store.isConnected" class="flex items-center gap-1.5">
        <button
          type="button"
          @click="store.saveConfig()"
          :disabled="store.isLoading || store.isRefreshing"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          :class="
            store.hasUnsavedChanges
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          "
          :title="
            store.hasUnsavedChanges
              ? '快捷键 Ctrl+S 保存所有改动'
              : '所有更改已同步'
          ">
          <span
            class="text-sm shrink-0"
            :class="
              store.isLoading
                ? 'i-svg-spinners-90-ring-with-bg'
                : store.hasUnsavedChanges
                  ? 'i-mdi-content-save-alert-outline'
                  : 'i-mdi-content-save-outline'
            "></span>
          <span>{{
            store.isLoading
              ? "保存中..."
              : store.hasUnsavedChanges
                ? "保存更改 *"
                : "保存配置"
          }}</span>
        </button>

        <button
          type="button"
          @click="store.refreshNodes()"
          :disabled="store.isLoading || store.isRefreshing"
          class="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 text-xs font-semibold"
          title="刷新节点并同步配置">
          <span
            class="text-sm block"
            :class="
              store.isRefreshing
                ? 'i-svg-spinners-90-ring-with-bg text-indigo-500'
                : 'i-mdi-refresh'
            "></span>
          <span>{{ store.isRefreshing ? "刷新中" : "刷新" }}</span>
        </button>
      </div>

      <!-- 快捷复制配置链接框 -->
      <div
        v-if="store.isConnected && store.profileUrl"
        class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
        <div
          class="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span class="flex items-center gap-1">
            <span class="i-mdi-link-variant"></span>
            <span>配置链接</span>
          </span>
          <button
            type="button"
            @click="copyProfile"
            class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-bold">
            <span
              :class="
                isCopied ? 'i-mdi-check text-emerald-500' : 'i-mdi-content-copy'
              "></span>
            <span>{{ isCopied ? "已复制" : "复制" }}</span>
          </button>
        </div>
        <p
          class="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate select-all"
          :title="store.profileUrl">
          {{ store.profileUrl }}
        </p>
      </div>

      <!-- 快速连接设置按钮 -->
      <button
        type="button"
        @click="emit('open-connect')"
        class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors">
        <div class="flex items-center gap-2">
          <span class="i-mdi-tune-variant text-sm text-indigo-500"></span>
          <span>{{
            store.isConnected ? "Worker 连接配置" : "配置连接凭证"
          }}</span>
        </div>
        <span
          class="text-[10px] px-1.5 py-0.2 rounded font-medium"
          :class="
            store.isConnected
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
              : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
          ">
          {{ store.isConnected ? "已连接" : "未连接" }}
        </span>
      </button>
    </div>
  </aside>
</template>
