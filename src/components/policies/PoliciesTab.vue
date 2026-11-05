<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "@/store";
import PageContainer from "@/components/layout/PageContainer.vue";
import PolicyCard from "./PolicyCard.vue";

const store = useStore();

const allPoliciesExpanded = computed(
  () =>
    store.uiConfig.policies.length > 0 &&
    store.uiConfig.policies.every((p) => p.isExpanded),
);
</script>

<template>
  <PageContainer title="策略组">
    <template #actions>
      <button
        v-if="store.uiConfig.policies.length > 0"
        type="button"
        @click="store.toggleAllPolicies(!allPoliciesExpanded)"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors">
        <span
          :class="
            allPoliciesExpanded
              ? 'i-mdi-collapse-all-outline'
              : 'i-mdi-expand-all-outline'
          "></span>
        <span>{{ allPoliciesExpanded ? "全部折叠" : "全部展开" }}</span>
      </button>

      <button
        type="button"
        @click="store.addPolicy"
        class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-plus text-indigo-500"></span>
        <span>添加</span>
      </button>
    </template>

    <div class="space-y-3">
      <!-- 空状态提示 -->
      <div
        v-if="store.uiConfig.policies.length === 0"
        class="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-400 text-xs space-y-2">
        <span
          class="i-mdi-layers-off text-3xl block mx-auto text-slate-300 dark:text-slate-600"></span>
        <p class="font-medium">暂无策略组</p>
      </div>

      <!-- 策略组卡片列表 (紧凑间距) -->
      <PolicyCard
        v-for="(policy, idx) in store.uiConfig.policies"
        :key="policy._uid"
        :policy="policy"
        :index="idx" />
    </div>
  </PageContainer>
</template>
