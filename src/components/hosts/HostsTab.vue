<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "@/store";
import { deriveMirrorGroupName, normalizeMirrorHost } from "@/utils/derived";
import PageContainer from "@/components/layout/PageContainer.vue";

const store = useStore();
const visibleSecrets = ref<Record<string, boolean>>({});

const edgeGroupNames = computed(() =>
  store.uiConfig.endpoints
    .filter((g) => g.kind === "edge" && g.name.trim())
    .map((g) => g.name.trim()),
);

function toggleSecretVisibility(uid: string) {
  visibleSecrets.value[uid] = !visibleSecrets.value[uid];
}

function previewDerivedGroups(mirrorName: string): string[] {
  const clean = mirrorName.trim();
  if (!clean) return [];
  return edgeGroupNames.value.map((ep) => deriveMirrorGroupName(ep, clean));
}
</script>

<template>
  <PageContainer
    title="主机组"
    subtitle="配置备用 Worker 主机（域名与密钥），自动为外层节点组派生镜像通道">
    <template #actions>
      <button
        type="button"
        @click="store.addMirrorHost()"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors">
        <span class="i-mdi-plus text-indigo-500"></span>
        <span>添加主机</span>
      </button>
    </template>

    <div class="space-y-3">
      <!-- 空状态 -->
      <div
        v-if="store.uiConfig.mirrors.length === 0"
        class="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-400 text-xs space-y-2">
        <span
          class="i-mdi-lan-connect text-3xl block mx-auto text-slate-300 dark:text-slate-600"></span>
        <p class="font-medium">暂无备用主机</p>
        <p class="text-[11px] text-slate-400">
          次号只需部署同款 Worker 并配置好 SIGN_KEY，在此填写其域名和密钥即可自动派生
          <span class="font-mono">cf-back</span> 等外层节点组
        </p>
      </div>

      <!-- 主机列表 -->
      <div
        v-for="(mirror, index) in store.uiConfig.mirrors"
        :key="mirror._uid"
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <!-- 头部：序号、别名、开关与删除 -->
        <div
          class="flex items-center justify-between gap-3 pb-3 border-b border-slate-150 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span
              class="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-500 flex items-center justify-center shrink-0">
              {{ index + 1 }}
            </span>

            <input
              :value="mirror.name"
              @change="
                store.renameMirrorHost(
                  mirror,
                  ($event.target as HTMLInputElement).value,
                )
              "
              placeholder="后缀别名（如 back）"
              class="w-32 sm:w-40 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 h-7" />

            <span
              class="text-[11px] text-slate-400 hidden sm:inline font-mono">
              后缀标识
            </span>
          </div>

          <div class="flex items-center gap-3">
            <!-- 启用滑块开关 -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                role="switch"
                :aria-checked="mirror.enabled"
                @click="
                  mirror.enabled = !mirror.enabled;
                  store.markDirty();
                "
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                :class="
                  mirror.enabled
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                "
                :title="mirror.enabled ? '已启用（点击停用）' : '已停用（点击启用）'">
                <span
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                  :class="mirror.enabled ? 'translate-x-4' : 'translate-x-0'" />
              </button>
              <span
                class="font-semibold text-[11px]"
                :class="
                  mirror.enabled
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400'
                ">
                {{ mirror.enabled ? "启用" : "停用" }}
              </span>
            </div>

            <button
              type="button"
              @click="store.removeMirrorHost(index)"
              class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="删除该主机">
              <span class="i-mdi-trash-can-outline text-base block"></span>
            </button>
          </div>
        </div>

        <!-- 主机域名与连接密钥 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="space-y-1">
            <label class="block font-semibold text-slate-700 dark:text-slate-300">
              主机域名 (Host / SNI)
            </label>
            <input
              :value="mirror.host"
              @input="
                mirror.host = ($event.target as HTMLInputElement).value;
                store.markDirty();
              "
              @blur="mirror.host = normalizeMirrorHost(mirror.host)"
              placeholder="例如: cf-back.example.space"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="space-y-1">
            <label class="block font-semibold text-slate-700 dark:text-slate-300">
              连接密钥 (SIGN_KEY)
            </label>
            <div class="relative">
              <input
                :type="visibleSecrets[mirror._uid] ? 'text' : 'password'"
                :value="mirror.secret"
                @input="
                  mirror.secret = ($event.target as HTMLInputElement).value;
                  store.markDirty();
                "
                placeholder="填写 SIGN_KEY 或标准 UUID"
                class="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500" />
              <button
                type="button"
                @click="toggleSecretVisibility(mirror._uid)"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                :title="visibleSecrets[mirror._uid] ? '隐藏密钥' : '显示密钥'">
                <span
                  :class="
                    visibleSecrets[mirror._uid]
                      ? 'i-mdi-eye-off-outline'
                      : 'i-mdi-eye-outline'
                  "
                  class="text-sm block"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 派生组预览 -->
        <div
          v-if="previewDerivedGroups(mirror.name).length > 0"
          class="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>将派生外层组:</span>
          <span
            v-for="name in previewDerivedGroups(mirror.name)"
            :key="name"
            class="px-2 py-0.5 rounded-md font-mono font-semibold"
            :class="
              mirror.enabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 line-through'
            ">
            {{ name }}
          </span>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
