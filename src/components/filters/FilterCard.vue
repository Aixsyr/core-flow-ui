<script setup lang="ts">
import { useStore } from "@/store";
import type { UIFilter } from "@/types/config";
import BaseCard from "@/components/layout/BaseCard.vue";
import { RULE_TYPES, parseRuleLine, formatRuleLine } from "@/utils/extractor";

const props = defineProps<{
  filter: UIFilter;
  index: number;
}>();

const store = useStore();

function toggleExpand() {
  props.filter.isExpanded = !props.filter.isExpanded;
}

function updateRuleValue(idx: number, newVal: string) {
  if (!props.filter.items) props.filter.items = [];
  const parsed = parseRuleLine(props.filter.items[idx] || "");
  props.filter.items[idx] = formatRuleLine(parsed.type, newVal);
  store.markDirty();
}

function updateRuleType(idx: number, newType: string) {
  if (!props.filter.items) props.filter.items = [];
  const parsed = parseRuleLine(props.filter.items[idx] || "");
  props.filter.items[idx] = formatRuleLine(newType, parsed.value);
  store.markDirty();
}

function addRuleLine() {
  if (!props.filter.items) props.filter.items = [];
  props.filter.items.push("DOMAIN-KEYWORD,");
  store.markDirty();
}

function removeRuleLine(idx: number) {
  if (!props.filter.items) return;
  props.filter.items.splice(idx, 1);
  store.markDirty();
}

function moveRuleLine(idx: number, delta: number) {
  if (!props.filter.items) return;
  const target = idx + delta;
  if (target < 0 || target >= props.filter.items.length) return;
  const temp = props.filter.items[idx];
  props.filter.items[idx] = props.filter.items[target];
  props.filter.items[target] = temp;
  store.markDirty();
}

function updateCodeText(text: string) {
  props.filter.items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  store.markDirty();
}

function moveFilter(delta: number) {
  const list = store.uiConfig.filters;
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
    :is-expanded="filter.isExpanded"
    :can-move-down="index < store.uiConfig.filters.length - 1"
    :disabled="!filter.enabled"
    @toggle-expand="toggleExpand"
    @move-up="moveFilter(-1)"
    @move-down="moveFilter(1)"
    @remove="store.removeFilter(index)">
    <template #header>
      <!-- 规则集名称 (起始位置与节点组、策略组严格对齐) -->
      <input
        v-model="filter.name"
        @change="store.markDirty()"
        placeholder="规则集名称"
        class="w-28 sm:w-36 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs h-7" />

      <!-- 规则集类型 (内置 / 远程) -->
      <select
        v-model="filter.kind"
        @change="store.markDirty()"
        class="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none cursor-pointer h-7">
        <option value="inline">内置</option>
        <option value="remote">远程</option>
      </select>

      <!-- 分流目标策略选择器 -->
      <div
        class="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-xs h-7">
        <span
          class="text-indigo-800 dark:text-indigo-300 font-bold shrink-0 text-[10px]"
          >导向:</span
        >
        <select
          v-model="filter.target"
          @change="store.markDirty()"
          class="bg-transparent text-indigo-950 dark:text-indigo-200 font-bold text-xs focus:outline-none cursor-pointer">
          <option v-for="t in store.availableTargets" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <!-- 数量或 URL 摘要徽标 -->
      <span
        class="px-2 py-0.5 rounded font-mono text-[11px] font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 truncate max-w-[200px]"
        :title="
          filter.kind === 'remote'
            ? filter.url
            : `${filter.items?.length || 0} 条规则`
        ">
        {{
          filter.kind === "remote"
            ? filter.url || "未配置URL"
            : `${filter.items?.length || 0} 规则`
        }}
      </span>
    </template>

    <!-- 右侧前置操作：启用/停用滑块开关 (现代精致滑块) -->
    <template #actions-prefix>
      <button
        type="button"
        role="switch"
        :aria-checked="filter.enabled"
        @click="filter.enabled = !filter.enabled; store.markDirty()"
        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mr-1"
        :class="filter.enabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'"
        :title="filter.enabled ? '已启用（点击停用）' : '已停用（点击启用）'">
        <span
          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
          :class="filter.enabled ? 'translate-x-4' : 'translate-x-0'" />
      </button>
    </template>

    <!-- 展开内容主体 -->
    <!-- 1. 远程规则源配置 -->
    <div v-if="filter.kind === 'remote'" class="space-y-3">
      <div
        class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2 h-7">
          <span
            class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span class="i-mdi-cloud-download-outline text-indigo-500"></span>
            <span>远程规则源配置</span>
          </span>
          <span class="text-slate-400 text-[11px]">
            {{ filter.behavior }}
          </span>
        </div>
        <div class="flex items-center gap-2 h-7"></div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="sm:col-span-2 space-y-1">
          <label class="font-semibold text-slate-700 dark:text-slate-300">
            规则源 URL:
          </label>
          <input
            v-model="filter.url"
            @change="store.markDirty()"
            placeholder="https://example.com/rules/reject.txt"
            class="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
        </div>

        <div class="space-y-1">
          <label class="font-semibold text-slate-700 dark:text-slate-300">
            匹配行为 (behavior):
          </label>
          <select
            v-model="filter.behavior"
            @change="store.markDirty()"
            class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none cursor-pointer">
            <option value="domain">domain</option>
            <option value="cidr">cidr</option>
            <option value="mixed">mixed</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="font-semibold text-slate-700 dark:text-slate-300">
            更新周期 (秒):
          </label>
          <input
            v-model.number="filter.interval"
            @change="store.markDirty()"
            type="number"
            placeholder="86400"
            class="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs" />
        </div>
      </div>
    </div>

    <!-- 2. 内置自填规则配置 (彻底去除了多余套嵌的灰框边框) -->
    <div v-else class="space-y-3">
      <div
        class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2 h-7">
          <span
            class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span class="i-mdi-filter-variant text-indigo-500"></span>
            <span>内置规则明细</span>
          </span>
          <span class="text-slate-400 text-[11px]">
            共 {{ filter.items?.length || 0 }} 条
          </span>
        </div>

        <!-- 模式切换按键 (固定 h-7，严禁撑高) -->
        <div
          class="h-7 inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            @click="filter.viewMode = 'list'"
            class="h-full px-2.5 rounded-md text-xs transition-all flex items-center gap-1.5"
            :class="
              filter.viewMode !== 'code'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            ">
            <span class="i-mdi-format-list-bulleted text-xs"></span>
            <span>列表</span>
          </button>
          <button
            type="button"
            @click="filter.viewMode = 'code'"
            class="h-full px-2.5 rounded-md text-xs transition-all flex items-center gap-1.5"
            :class="
              filter.viewMode === 'code'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            ">
            <span class="i-mdi-code-braces text-xs"></span>
            <span>文本</span>
          </button>
        </div>
      </div>

      <!-- 列表模式：直接平铺规则行，杜绝卡片内再套一层灰底大边框 -->
      <div v-if="filter.viewMode !== 'code'" class="space-y-2">
        <div class="space-y-1.5">
          <div
            v-for="(rLine, rIdx) in filter.items"
            :key="rIdx"
            class="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 shadow-2xs">
            <span class="w-6 text-center font-mono text-slate-400 text-xs">
              {{ rIdx + 1 }}
            </span>

            <input
              type="text"
              :value="parseRuleLine(rLine).value"
              @input="
                updateRuleValue(
                  rIdx,
                  ($event.target as HTMLInputElement).value,
                )
              "
              placeholder="匹配值 (如: cloudflare, google.com 或 1.1.1.1/32)"
              class="flex-1 px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs h-7" />

            <select
              :value="parseRuleLine(rLine).type"
              @change="
                updateRuleType(
                  rIdx,
                  ($event.target as HTMLSelectElement).value,
                )
              "
              class="w-48 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs shrink-0 h-7">
              <option v-for="t in RULE_TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>

            <button
              type="button"
              @click="moveRuleLine(rIdx, -1)"
              :disabled="rIdx === 0"
              class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
              title="上移">
              <span class="i-mdi-arrow-up text-xs"></span>
            </button>

            <button
              type="button"
              @click="moveRuleLine(rIdx, 1)"
              :disabled="rIdx === (filter.items?.length || 0) - 1"
              class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
              title="下移">
              <span class="i-mdi-arrow-down text-xs"></span>
            </button>

            <button
              type="button"
              @click="removeRuleLine(rIdx)"
              class="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
              title="删除">
              <span class="i-mdi-delete text-sm"></span>
            </button>
          </div>
        </div>

        <div
          v-if="!filter.items || filter.items.length === 0"
          class="py-6 text-center text-slate-400 text-xs">
          暂无规则
        </div>

        <div class="pt-1">
          <button
            type="button"
            @click="addRuleLine"
            class="px-3 py-1.5 rounded-lg border border-dashed border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors shadow-2xs">
            <span class="i-mdi-plus text-xs"></span>
            <span>添加规则</span>
          </button>
        </div>
      </div>

      <!-- 文本模式 -->
      <div v-else class="space-y-1.5">
        <textarea
          :value="(filter.items || []).join('\n')"
          @input="
            updateCodeText(($event.target as HTMLTextAreaElement).value)
          "
          rows="6"
          placeholder="DOMAIN-SUFFIX,google.com&#10;DOMAIN-KEYWORD,github&#10;IP-CIDR,192.168.1.0/24"
          class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-2xs"></textarea>
      </div>
    </div>
  </BaseCard>
</template>
