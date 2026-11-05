<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "@/store";
import PageContainer from "@/components/layout/PageContainer.vue";
import EndpointCard from "./EndpointCard.vue";

const store = useStore();

const allEndpointsExpanded = computed(
  () =>
    store.uiConfig.endpoints.length > 0 &&
    store.uiConfig.endpoints.every((e) => e.isExpanded),
);
</script>

<template>
  <PageContainer title="节点组">
    <template #actions>
      <button
        v-if="store.uiConfig.endpoints.length > 0"
        type="button"
        @click="store.toggleAllEndpoints(!allEndpointsExpanded)"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors">
        <span
          :class="
            allEndpointsExpanded
              ? 'i-mdi-collapse-all-outline'
              : 'i-mdi-expand-all-outline'
          "></span>
        <span>{{ allEndpointsExpanded ? "全部折叠" : "全部展开" }}</span>
      </button>

      <button
        type="button"
        @click="store.addEndpointGroup('edge')"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-plus text-amber-500"></span>
        <span>外层</span>
      </button>

      <button
        type="button"
        @click="store.addEndpointGroup('gateway')"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-plus text-sky-500"></span>
        <span>出口</span>
      </button>

      <button
        type="button"
        @click="store.addEndpointGroup('wrapped')"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-plus text-emerald-500"></span>
        <span>加密</span>
      </button>
    </template>

    <div class="space-y-3">
      <!-- 空状态提示 -->
      <div
        v-if="store.uiConfig.endpoints.length === 0"
        class="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-400 text-xs space-y-2">
        <span
          class="i-mdi-server-off text-3xl block mx-auto text-slate-300 dark:text-slate-600"></span>
        <p class="font-medium">暂无节点组</p>
      </div>

      <!-- 节点组卡片列表 -->
      <EndpointCard
        v-for="(group, idx) in store.uiConfig.endpoints"
        :key="group._uid"
        :group="group"
        :index="idx" />
    </div>
  </PageContainer>
</template>
