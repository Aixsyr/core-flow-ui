<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "@/store";
import PageContainer from "@/components/layout/PageContainer.vue";
import FilterCard from "./FilterCard.vue";

const store = useStore();

const allFiltersExpanded = computed(
  () =>
    store.uiConfig.filters.length > 0 &&
    store.uiConfig.filters.every((f) => f.isExpanded),
);
</script>

<template>
  <PageContainer title="分流规则">
    <template #actions>
      <button
        v-if="store.uiConfig.filters.length > 0"
        type="button"
        @click="store.toggleAllFilters(!allFiltersExpanded)"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors">
        <span
          :class="
            allFiltersExpanded
              ? 'i-mdi-collapse-all-outline'
              : 'i-mdi-expand-all-outline'
          "></span>
        <span>{{ allFiltersExpanded ? "全部折叠" : "全部展开" }}</span>
      </button>

      <button
        type="button"
        @click="store.addFilter('remote')"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-earth text-indigo-500"></span>
        <span>远程规则</span>
      </button>

      <button
        type="button"
        @click="store.addFilter('inline')"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-text-box-outline text-indigo-500"></span>
        <span>内置规则</span>
      </button>
    </template>

    <div class="space-y-3">
      <!-- 空状态提示 -->
      <div
        v-if="store.uiConfig.filters.length === 0"
        class="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-400 text-xs space-y-2">
        <span
          class="i-mdi-routes text-3xl block mx-auto text-slate-300 dark:text-slate-600 opacity-50"></span>
        <p class="font-medium">暂无分流规则</p>
      </div>

      <!-- 规则集列表 (紧凑矮化行高与间距) -->
      <FilterCard
        v-for="(filter, idx) in store.uiConfig.filters"
        :key="filter._uid"
        :filter="filter"
        :index="idx" />

      <!-- 默认规则 (MATCH) -->
      <div
        class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between gap-2 text-xs">
        <div>
          <span
            class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
            <span class="i-mdi-shield-outline text-indigo-500 text-sm"></span>
            <span>默认规则 (MATCH)</span>
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <select
            v-model="store.uiConfig.defaultTarget"
            @change="store.markDirty()"
            class="px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-bold text-xs focus:outline-none shadow-2xs cursor-pointer">
            <option v-for="t in store.availableTargets" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
