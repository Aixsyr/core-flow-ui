<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "@/store";
import type { UIEndpointGroup, EndpointKind } from "@/types/config";
import { parseNodesText } from "@/utils/extractor";
import BaseCard from "@/components/layout/BaseCard.vue";

const props = defineProps<{
  group: UIEndpointGroup;
  index: number;
}>();

const store = useStore();

const availablePolicies = computed(() => store.uiConfig.policies || []);

const parsedNodes = computed(() => {
  return parseNodesText(
    props.group.rawText || "",
    props.group.kind,
    props.group.name,
  );
});

const nodeCount = computed(() => {
  return parsedNodes.value.length;
});

const semicolonErrors = ref<number[]>([]);

function validateSemicolons() {
  const text = props.group.rawText || "";
  const lines = text.split("\n");
  const expected = props.group.kind === "wrapped" ? 10 : 2;

  let firstIdx = -1;
  let lastIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }
  }

  if (firstIdx === -1) {
    semicolonErrors.value = [];
    return;
  }

  const bad: number[] = [];
  for (let i = firstIdx; i <= lastIdx; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
      continue;
    }
    const count = (line.match(/;/g) || []).length;
    if (count !== expected) {
      bad.push(i + 1);
    }
  }
  semicolonErrors.value = bad;
}

const placeholderText = computed(() =>
  props.group.kind === "wrapped"
    ? "名称;host;port;transport;username;password;cipher;auth;ca;cert;key"
    : "名称;host;port",
);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const gutterRef = ref<HTMLDivElement | null>(null);
const backdropRef = ref<HTMLDivElement | null>(null);

const totalLines = computed(() => {
  const text = props.group.rawText || "";
  return text.split("\n").length || 1;
});

const tokens = computed(() => {
  let text = props.group.rawText || "";
  if (text.endsWith("\n")) {
    text += " ";
  }
  return text.split(/(;)/g);
});

function handleScroll() {
  if (!textareaRef.value) return;
  const { scrollTop, scrollLeft } = textareaRef.value;
  if (gutterRef.value) {
    gutterRef.value.scrollTop = scrollTop;
  }
  if (backdropRef.value) {
    backdropRef.value.scrollTop = scrollTop;
    backdropRef.value.scrollLeft = scrollLeft;
  }
}

function handleKindChange(kind: EndpointKind) {
  props.group.kind = kind;
  if (kind === "edge") {
    props.group.parent = "";
  } else if (!props.group.parent) {
    props.group.parent = store.uiConfig.policies[0]?.name || "";
  }
  validateSemicolons();
  store.markDirty();
}

function toggleExpand() {
  props.group.isExpanded = !props.group.isExpanded;
}

function moveEndpoint(delta: number) {
  const list = store.uiConfig.endpoints;
  const target = props.index + delta;
  if (target < 0 || target >= list.length) return;
  const temp = list[props.index];
  list[props.index] = list[target];
  list[target] = temp;
  store.markDirty();
}

function clearRawText() {
  if (confirm(`确定清空节点组【${props.group.name}】下的所有节点文本吗？`)) {
    props.group.rawText = "";
    semicolonErrors.value = [];
    store.markDirty();
  }
}
</script>

<template>
  <BaseCard
    :index="index"
    :is-expanded="group.isExpanded"
    :can-move-down="index < store.uiConfig.endpoints.length - 1"
    @toggle-expand="toggleExpand"
    @move-up="moveEndpoint(-1)"
    @move-down="moveEndpoint(1)"
    @remove="store.removeEndpointGroup(index)">
    <template #header>
      <!-- 节点组名称 -->
      <input
        :value="group.name"
        @change="
          store.renameEndpointGroup(
            group,
            ($event.target as HTMLInputElement).value,
          )
        "
        placeholder="节点组名称"
        class="w-28 sm:w-36 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs h-7" />

      <!-- 节点组类型 -->
      <select
        :value="group.kind"
        @change="
          handleKindChange(
            ($event.target as HTMLSelectElement).value as EndpointKind,
          )
        "
        class="px-2 py-0.5 rounded font-semibold text-xs border shadow-2xs focus:outline-none cursor-pointer h-7"
        :class="
          group.kind === 'edge'
            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
            : group.kind === 'gateway'
              ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
        ">
        <option value="edge">外层</option>
        <option value="gateway">出口</option>
        <option value="wrapped">加密</option>
      </select>

      <!-- 前置策略选择器 (gateway 必填, wrapped 可选) -->
      <div
        v-if="group.kind === 'gateway' || group.kind === 'wrapped'"
        class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-250 dark:border-amber-800 text-xs h-7">
        <span
          class="text-amber-800 dark:text-amber-300 font-bold shrink-0 text-[11px]"
          >前置:</span
        >
        <select
          v-model="group.parent"
          @change="store.markDirty()"
          class="bg-transparent text-amber-900 dark:text-amber-100 font-semibold text-xs focus:outline-none cursor-pointer">
          <option value="">无</option>
          <option
            v-for="p in availablePolicies"
            :key="p._uid"
            :value="p.name">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- 节点数量徽标 -->
      <span
        class="px-2 py-0.5 rounded font-mono text-[11px] font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
        {{ nodeCount }} 节点
      </span>
    </template>

    <!-- 节点列表编辑区 -->
    <div class="space-y-2">
      <div
        class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2 h-7">
          <span
            class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span class="i-mdi-text-box-outline text-indigo-500"></span>
            <span>节点列表</span>
          </span>
          <span class="text-slate-400 text-[11px]">
            {{ parsedNodes.length }} 个节点
          </span>
        </div>

        <div class="flex items-center gap-2 h-7">
          <button
            v-if="group.rawText"
            type="button"
            @click="clearRawText"
            class="h-7 px-2 rounded-md text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center">
            清空
          </button>
        </div>
      </div>

      <!-- 编辑器容器：左侧行号栏 + 右侧分号高亮层与原生输入框 -->
      <div
        class="w-full h-48 min-h-[140px] max-h-[600px] resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex overflow-hidden shadow-2xs font-mono text-xs">
        <!-- 左侧行号栏 (Gutter) -->
        <div
          ref="gutterRef"
          aria-hidden="true"
          class="w-9 shrink-0 select-none py-2.5 bg-slate-100/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-[11px] leading-5 overflow-hidden">
          <div
            v-for="lineNum in totalLines"
            :key="lineNum"
            class="px-1.5 transition-colors"
            :class="
              semicolonErrors.includes(lineNum)
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 dark:text-slate-500'
            ">
            {{ lineNum }}
          </div>
        </div>

        <!-- 右侧编辑区 -->
        <div class="relative flex-1 h-full overflow-hidden">
          <!-- 底层分号高亮层 (Underlay) -->
          <div
            ref="backdropRef"
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 py-2.5 px-3 overflow-hidden whitespace-pre font-mono text-xs leading-5 select-none text-transparent">
            <template v-for="(token, tIdx) in tokens" :key="tIdx">
              <span
                v-if="token === ';'"
                class="bg-indigo-200/90 text-transparent dark:bg-indigo-800/80 rounded-xs"
                >;</span
              >
              <span v-else>{{ token }}</span>
            </template>
          </div>

          <!-- 上层原生输入框 (透明背景，字符在分号色块之上) -->
          <textarea
            ref="textareaRef"
            v-model="group.rawText"
            @change="store.markDirty()"
            @blur="validateSemicolons"
            @scroll="handleScroll"
            :placeholder="placeholderText"
            class="relative w-full h-full py-2.5 px-3 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs leading-5 whitespace-pre overflow-x-auto overflow-y-auto resize-none focus:outline-none focus:ring-0 border-0 m-0"></textarea>
        </div>
      </div>

      <p
        v-if="semicolonErrors.length > 0"
        class="text-rose-500 font-mono text-[11px] font-semibold">
        分号数量不正确: {{ semicolonErrors.join(" ") }} 行
      </p>
    </div>
  </BaseCard>
</template>
