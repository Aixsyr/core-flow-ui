<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "@/store";
import type { UIPolicy } from "@/types/config";
import { parseNodesText } from "@/utils/extractor";
import BaseCard from "@/components/layout/BaseCard.vue";

const props = defineProps<{
  policy: UIPolicy;
  index: number;
}>();

const store = useStore();

function toggleExpand() {
  props.policy.isExpanded = !props.policy.isExpanded;
}

// 候选出站结构
export interface CandidateOption {
  key: string; // "direct" | "reject" | "endpoint:<name>" | "policy:<name>"
  type: "direct" | "reject" | "endpoint" | "policy";
  label: string;
  count?: number;
  active: boolean;
}

// 解析当前策略可用的所有候选（按 policy.order 顺序排列，激活在前，未激活排后）
const candidateCards = computed<CandidateOption[]>(() => {
  const activeKeys = new Set(props.policy.order || []);
  const allMap = new Map<string, CandidateOption>();

  // 1. 内置 direct / reject
  allMap.set("direct", {
    key: "direct",
    type: "direct",
    label: "DIRECT",
    active: activeKeys.has("direct"),
  });
  allMap.set("reject", {
    key: "reject",
    type: "reject",
    label: "REJECT",
    active: activeKeys.has("reject"),
  });

  // 2. 节点组 (按组名)
  for (const ep of store.uiConfig.endpoints) {
    if (!ep.name) continue;
    const key = `endpoint:${ep.name}`;
    allMap.set(key, {
      key,
      type: "endpoint",
      label: ep.name,
      count: parseNodesText(ep.rawText || "", ep.kind, ep.name).length,
      active: activeKeys.has(key),
    });
  }

  // 3. 其他策略组 (按策略名，排除自身)
  for (const p of store.uiConfig.policies) {
    if (!p.name || p.name === props.policy.name) continue;
    const key = `policy:${p.name}`;
    allMap.set(key, {
      key,
      type: "policy",
      label: p.name,
      active: activeKeys.has(key),
    });
  }

  // 按 order 排列已激活的，其余未激活项排在后面
  const orderMap = new Map<string, number>();
  (props.policy.order || []).forEach((key, idx) => orderMap.set(key, idx));

  return Array.from(allMap.values()).sort((a, b) => {
    const idxA = orderMap.has(a.key) ? (orderMap.get(a.key) as number) : 9999;
    const idxB = orderMap.has(b.key) ? (orderMap.get(b.key) as number) : 9999;
    return idxA - idxB;
  });
});

// 切换某候选是否激活
function toggleCandidate(candidate: CandidateOption) {
  const current = [...(props.policy.order || [])];
  const idx = current.indexOf(candidate.key);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(candidate.key);
  }
  props.policy.order = current;
  store.markDirty();
}

// 移动某个候选在 order 中的顺序
function moveCandidate(cKey: string, delta: number) {
  const current = [...(props.policy.order || [])];
  const idx = current.indexOf(cKey);
  if (idx < 0) return;
  const target = idx + delta;
  if (target < 0 || target >= current.length) return;

  const temp = current[idx];
  current[idx] = current[target];
  current[target] = temp;
  props.policy.order = current;
  store.markDirty();
}

// 全选/取消全选节点组
const isAllEndpointsSelected = computed(() => {
  const epKeys = store.uiConfig.endpoints.map((e) => `endpoint:${e.name}`);
  if (epKeys.length === 0) return false;
  const current = new Set(props.policy.order || []);
  return epKeys.every((k) => current.has(k));
});

function toggleAllEndpoints() {
  const epKeys = store.uiConfig.endpoints.map((e) => `endpoint:${e.name}`);
  if (isAllEndpointsSelected.value) {
    props.policy.order = (props.policy.order || []).filter(
      (k) => !k.startsWith("endpoint:"),
    );
  } else {
    const current = new Set(props.policy.order || []);
    epKeys.forEach((k) => current.add(k));
    props.policy.order = Array.from(current);
  }
  store.markDirty();
}

function clearAllCandidates() {
  props.policy.order = [];
  store.markDirty();
}

// 策略组自身上下移
function movePolicy(delta: number) {
  const list = store.uiConfig.policies;
  const target = props.index + delta;
  if (target < 0 || target >= list.length) return;
  const temp = list[props.index];
  list[props.index] = list[target];
  list[target] = temp;
  store.markDirty();
}
</script>

<template>
  <BaseCard
    :index="index"
    :is-expanded="policy.isExpanded"
    :can-move-down="index < store.uiConfig.policies.length - 1"
    @toggle-expand="toggleExpand"
    @move-up="movePolicy(-1)"
    @move-down="movePolicy(1)"
    @remove="store.removePolicy(index)">
    <template #header>
      <!-- 策略组名称 -->
      <input
        :value="policy.name"
        @change="
          store.renamePolicy(
            policy,
            ($event.target as HTMLInputElement).value,
          )
        "
        placeholder="策略组名称"
        class="w-28 sm:w-36 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs h-7" />

      <!-- 模式选择器 -->
      <select
        v-model="policy.mode"
        @change="store.markDirty()"
        class="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none cursor-pointer h-7">
        <option value="manual">手动选择</option>
        <option value="probe">自动测速</option>
        <option value="failover">故障转移</option>
      </select>

      <!-- 策略组候选出站数量徽标（统一与节点组、分流规则一致） -->
      <span
        class="px-2 py-0.5 rounded font-mono text-[11px] font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
        {{ policy.order?.length || 0 }} 项
      </span>
    </template>

    <!-- 出站候选操作栏 (统一顶栏基线与下划线) -->
    <div
      class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2 h-7">
        <span
          class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <span class="i-mdi-swap-horizontal text-indigo-500"></span>
          <span>候选出站</span>
        </span>
        <span class="text-slate-400 text-[11px]">
          已选 {{ policy.order?.length || 0 }} 项
        </span>
      </div>

      <div class="flex items-center gap-2 h-7">
        <button
          type="button"
          @click="toggleAllEndpoints"
          class="h-7 px-2.5 rounded-md text-xs font-semibold border transition-colors shadow-2xs flex items-center"
          :class="
            isAllEndpointsSelected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
          ">
          {{ isAllEndpointsSelected ? "取消全选" : "全选节点组" }}
        </button>

        <button
          type="button"
          @click="clearAllCandidates"
          class="h-7 px-2 rounded-md text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center">
          清空
        </button>
      </div>
    </div>

    <!-- 候选卡片流 -->
    <div class="flex flex-wrap gap-2 pt-1 items-center">
      <div
        v-for="card in candidateCards"
        :key="card.key"
        @click="toggleCandidate(card)"
        class="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs select-none transition-all cursor-pointer shadow-2xs font-medium"
        :class="[
          card.active
            ? card.type === 'direct'
              ? 'bg-amber-100/90 text-amber-950 border-amber-400 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-500 font-bold'
              : card.type === 'reject'
                ? 'bg-rose-100/90 text-rose-950 border-rose-400 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-500 font-bold'
                : card.type === 'endpoint'
                  ? 'bg-emerald-100/90 text-emerald-950 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-500 font-bold'
                  : 'bg-purple-100/90 text-purple-950 border-purple-400 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-500 font-bold'
            : 'bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750 hover:border-slate-400',
        ]">
        <!-- 排序箭头 (仅在已激活时可用) -->
        <div
          v-if="card.active"
          class="flex items-center gap-0.5 -ml-1 text-slate-400"
          @click.stop>
          <button
            type="button"
            @click="moveCandidate(card.key, -1)"
            class="hover:text-indigo-600 p-0.5"
            title="前移">
            <span class="i-mdi-chevron-left text-xs"></span>
          </button>
          <button
            type="button"
            @click="moveCandidate(card.key, 1)"
            class="hover:text-indigo-600 p-0.5"
            title="后移">
            <span class="i-mdi-chevron-right text-xs"></span>
          </button>
        </div>

        <!-- 图标指示 -->
        <span
          class="text-sm"
          :class="[
            card.type === 'direct'
              ? 'i-mdi-arrow-decision-auto text-amber-600 dark:text-amber-400'
              : card.type === 'reject'
                ? 'i-mdi-cancel text-rose-600 dark:text-rose-400'
                : card.type === 'endpoint'
                  ? 'i-mdi-server-network text-emerald-600 dark:text-emerald-400'
                  : 'i-mdi-layers-triple-outline text-purple-600 dark:text-purple-400',
          ]"></span>

        <!-- 名称 -->
        <span class="font-bold tracking-tight">{{ card.label }}</span>

        <!-- 节点数量标记 (仅静态节点组拥有) -->
        <span
          v-if="card.count !== undefined"
          class="px-1.5 py-0.2 rounded-full font-mono text-[10px]"
          :class="
            card.active
              ? 'bg-emerald-200/60 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          ">
          {{ card.count }}
        </span>

        <!-- 勾选指示点 -->
        <div
          class="w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ml-0.5 shrink-0"
          :class="[
            card.active
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
          ]">
          <span v-if="card.active" class="i-mdi-check text-[9px]"></span>
        </div>
      </div>
    </div>

    <!-- 测速参数 (仅 probe / failover) -->
    <div
      v-if="policy.mode === 'probe' || policy.mode === 'failover'"
      class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
      <div>
        <label
          class="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1"
          >测速 URL:</label
        >
        <input
          v-model="policy.testUrl"
          @change="store.markDirty()"
          placeholder="http://www.gstatic.com/generate_204"
          class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
      </div>
      <div>
        <label
          class="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1"
          >测速间隔 (秒):</label
        >
        <input
          v-model.number="policy.interval"
          @change="store.markDirty()"
          type="number"
          placeholder="300"
          class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
      </div>
      <div>
        <label
          class="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1"
          >容差 (ms):</label
        >
        <input
          v-model.number="policy.tolerance"
          @change="store.markDirty()"
          type="number"
          placeholder="50"
          class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
      </div>
    </div>
  </BaseCard>
</template>
