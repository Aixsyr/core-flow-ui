<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useStore } from "@/store";
import Sidebar from "@/components/layout/Sidebar.vue";
import ConnectionModal from "@/components/layout/ConnectionModal.vue";
import EndpointsTab from "@/components/endpoints/EndpointsTab.vue";
import PoliciesTab from "@/components/policies/PoliciesTab.vue";
import FiltersTab from "@/components/filters/FiltersTab.vue";
import FallbackTab from "@/components/fallback/FallbackTab.vue";
import YamlPreviewTab from "@/components/preview/YamlPreviewTab.vue";

const store = useStore();
const showConnectionModal = ref(false);

onMounted(async () => {
  if (store.workerBase && store.adminSecret) {
    try {
      await store.initCredentials();
    } catch {
      // 保持未连接状态，等待用户配置
    }
  }
});
</script>

<template>
  <div
    class="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-row font-sans text-slate-800 dark:text-slate-200">
    <!-- 左侧常驻侧边栏 -->
    <Sidebar @open-connect="showConnectionModal = true" />

    <!-- 右侧主工作区 (独立垂直滚动) -->
    <div class="flex-1 min-w-0 h-screen overflow-y-auto">
      <!-- Tab 1: 节点组管理 -->
      <EndpointsTab v-show="store.activeTab === 'endpoints'" />

      <!-- Tab 2: 策略组管理 -->
      <PoliciesTab v-show="store.activeTab === 'policies'" />

      <!-- Tab 3: 分流规则管理 -->
      <FiltersTab v-show="store.activeTab === 'filters'" />

      <!-- Tab 4: 回退策略 -->
      <FallbackTab v-show="store.activeTab === 'fallback'" />

      <!-- Tab 5: 配置 YAML 预览 -->
      <YamlPreviewTab v-show="store.activeTab === 'preview'" />
    </div>

    <!-- 全局浮动 Toast 提示 -->
    <div
      v-if="store.toastMessage"
      class="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all duration-300"
      :class="
        store.toastType === 'success'
          ? 'bg-slate-900/95 text-emerald-400 border border-emerald-500/30 shadow-emerald-950/20'
          : store.toastType === 'error'
            ? 'bg-rose-950/95 text-rose-300 border border-rose-500/30 shadow-rose-950/20'
            : 'bg-slate-900/95 text-indigo-300 border border-indigo-500/30 shadow-indigo-950/20'
      ">
      <span
        :class="
          store.toastType === 'success'
            ? 'i-mdi-check-circle text-base text-emerald-400'
            : store.toastType === 'error'
              ? 'i-mdi-alert-circle text-base text-rose-400'
              : 'i-mdi-information text-base text-indigo-400'
        "></span>
      <span>{{ store.toastMessage }}</span>
    </div>

    <!-- 连接凭证模态配置框 -->
    <ConnectionModal
      :show="showConnectionModal"
      @close="showConnectionModal = false" />
  </div>
</template>
