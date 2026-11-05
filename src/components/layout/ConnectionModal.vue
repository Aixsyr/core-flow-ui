<script setup lang="ts">
import { ref, watch } from "vue";
import { useStore } from "@/store";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const store = useStore();

const tempBase = ref(store.workerBase);
const tempSecret = ref(store.adminSecret);
const showSecret = ref(false);
const isConnecting = ref(false);
const errorMsg = ref("");

watch(
  () => props.show,
  (val) => {
    if (val) {
      tempBase.value = store.workerBase;
      tempSecret.value = store.adminSecret;
      errorMsg.value = "";
    }
  },
);

async function handleSave() {
  const base = tempBase.value.trim();
  const secret = tempSecret.value.trim();

  if (!base) {
    errorMsg.value = "请输入 Cloudflare Worker 基础地址";
    return;
  }
  if (!secret) {
    errorMsg.value = "请输入管理密钥";
    return;
  }

  isConnecting.value = true;
  errorMsg.value = "";

  try {
    await store.updateConnection(base, secret);
    store.showToast("已成功连接至 Worker", "success");
    emit("close");
  } catch (err: any) {
    errorMsg.value =
      err.message || "连接失败，请检查 Worker 是否正常运行或密码是否正确";
  } finally {
    isConnecting.value = false;
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
    <div
      class="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
      <!-- 头部 -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3
          class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span class="i-mdi-tune-variant text-indigo-500"></span>
          <span>Worker 连接配置</span>
        </h3>
        <button
          @click="emit('close')"
          class="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span class="i-mdi-close text-lg"></span>
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="p-5 space-y-4 text-xs">
        <div class="space-y-1">
          <label class="font-semibold text-slate-700 dark:text-slate-300">
            Worker 基础地址 (Base URL)
          </label>
          <input
            v-model="tempBase"
            type="text"
            placeholder="http://127.0.0.1:8787 或 https://xxx.workers.dev"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs" />
        </div>

        <div class="space-y-1">
          <label class="font-semibold text-slate-700 dark:text-slate-300">
            管理密钥 (SIGN_KEY)
          </label>
          <div class="relative">
            <input
              v-model="tempSecret"
              :type="showSecret ? 'text' : 'password'"
              placeholder="输入环境变量中配置的 SIGN_KEY"
              class="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs" />
            <button
              type="button"
              @click="showSecret = !showSecret"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <span
                class="block text-base"
                :class="
                  showSecret ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'
                "></span>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            仅用于本地计算 SHA-256 路径 slug 与
            userId，密钥明文不参与任何网络请求。
          </p>
        </div>

        <!-- 错误提示 -->
        <div
          v-if="errorMsg"
          class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <span class="i-mdi-alert-circle text-sm shrink-0"></span>
          <span>{{ errorMsg }}</span>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div
        class="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <button
          @click="emit('close')"
          class="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          取消
        </button>
        <button
          @click="handleSave"
          :disabled="isConnecting"
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs">
          <span
            class="i-mdi-link"
            :class="{ 'animate-spin': isConnecting }"></span>
          <span>{{ isConnecting ? "正在连接..." : "保存并连接" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
