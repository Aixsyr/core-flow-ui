import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  UISettings,
  UIEndpointGroup,
  UIPolicy,
  UIFilter,
  EndpointKind,
  FilterKind,
} from "@/types/config";
import { deriveIdentity } from "@/utils/crypto";
import { CoreClient } from "@/api/client";
import {
  fromBackendSettings,
  toBackendSettings,
  generateUid,
} from "@/utils/serializer";
import { validateSettings } from "@/utils/validator";

export const useStore = defineStore("core", () => {
  // 连接参数
  const workerBase = ref(localStorage.getItem("core_base") || "");
  const adminSecret = ref(localStorage.getItem("core_secret") || "");

  const slug = ref("");
  const userId = ref("");
  const isConnected = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref("");

  // 主工作区当前激活的 Tab: endpoints | policies | filters | fallback | preview
  const activeTab = ref<
    "endpoints" | "policies" | "filters" | "fallback" | "preview"
  >("endpoints");

  // 前端状态树（fallback 固化为合法对象，彻底杜绝局部重复防御判空）
  const uiConfig = ref<UISettings>({
    defaultTarget: "DIRECT",
    fallback: {
      enabled: false,
      timeoutMs: 3500,
      hosts: [],
    },
    endpoints: [],
    policies: [],
    filters: [],
  });

  // 全局可用出站目标 (DIRECT, REJECT 及所有策略组名称)
  const availableTargets = computed(() => {
    const builtins = ["DIRECT", "REJECT"];
    const policies = uiConfig.value.policies.map((p) => p.name).filter(Boolean);
    return Array.from(new Set([...builtins, ...policies]));
  });

  // 配置文件链接
  const profileUrl = computed(() => {
    if (!isConnected.value || !workerBase.value || !slug.value) return "";
    const base = workerBase.value.replace(/\/+$/, "");
    return `${base}/${slug.value}/profile`;
  });

  // 全局 Toast
  const toastMessage = ref("");
  const toastType = ref<"success" | "error" | "info" | "warning">("success");
  let toastTimer: any = null;

  function showToast(
    msg: string,
    type: "success" | "error" | "info" | "warning" = "success",
  ) {
    toastMessage.value = msg;
    toastType.value = type;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.value = "";
    }, 3200);
  }

  // 未保存改动追踪
  const hasUnsavedChanges = ref(false);
  function markDirty() {
    hasUnsavedChanges.value = true;
  }

  let client: CoreClient | null = null;

  async function initCredentials() {
    if (!workerBase.value.trim() || !adminSecret.value.trim()) {
      isConnected.value = false;
      slug.value = "";
      userId.value = "";
      client = null;
      return;
    }

    isLoading.value = true;
    errorMessage.value = "";
    try {
      const derived = await deriveIdentity(adminSecret.value.trim());
      slug.value = derived.slug;
      userId.value = derived.userId;
      client = new CoreClient(workerBase.value.trim(), slug.value);

      localStorage.setItem("core_base", workerBase.value.trim());
      localStorage.setItem("core_secret", adminSecret.value.trim());

      await refreshConfig();
      isConnected.value = true;
    } catch (err: any) {
      isConnected.value = false;
      slug.value = "";
      userId.value = "";
      client = null;
      errorMessage.value = err.message || "连接后端失败";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshConfig() {
    if (!client) throw new Error("请先完成连接配置");
    isLoading.value = true;
    errorMessage.value = "";
    try {
      const remote = await client.getSettings();
      uiConfig.value = fromBackendSettings(remote);
      isConnected.value = true;
      hasUnsavedChanges.value = false;
    } catch (err: any) {
      errorMessage.value = err.message || "读取配置失败";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  const isRefreshing = ref(false);

  async function refreshNodes() {
    if (!client || !isConnected.value) {
      showToast("请先完成连接配置", "warning");
      return;
    }

    if (hasUnsavedChanges.value) {
      if (!confirm("当前有未保存的本地改动，刷新节点将覆盖未保存的配置，确定继续吗？")) {
        return;
      }
    }

    isRefreshing.value = true;
    errorMessage.value = "";
    try {
      await client.refreshNodes();
      await refreshConfig();
      showToast("节点已刷新并同步最新配置", "success");
    } catch (err: any) {
      const msg = err.message || "刷新节点失败";
      errorMessage.value = msg;
      showToast(msg, "error");
    } finally {
      isRefreshing.value = false;
    }
  }

  async function saveConfig(): Promise<boolean> {
    if (!client || !isConnected.value) {
      throw new Error("未连接至 Worker，无法保存配置");
    }

    // 保存前本地预检
    const validation = validateSettings(uiConfig.value);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      showToast(firstError, "error");
      throw new Error(firstError);
    }

    isLoading.value = true;
    errorMessage.value = "";
    try {
      const payload = toBackendSettings(uiConfig.value);
      await client.saveSettings(payload);
      hasUnsavedChanges.value = false;
      showToast("全部配置已成功保存至 Worker", "success");
      return true;
    } catch (err: any) {
      errorMessage.value = err.message || "保存配置失败";
      showToast(errorMessage.value, "error");
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function previewProfile(): Promise<string> {
    if (!client || !isConnected.value) {
      throw new Error("未连接 Worker，无法生成配置预览");
    }
    return await client.getProfile();
  }

  async function updateConnection(newBase: string, newSecret: string) {
    workerBase.value = newBase.trim();
    adminSecret.value = newSecret.trim();
    await initCredentials();
  }

  // ===========================================================================
  // 折叠操作快捷方法（通用单逻辑驱动）
  // ===========================================================================

  function toggleListExpand(
    list: { isExpanded: boolean }[],
    forceExpand?: boolean,
  ) {
    const target =
      forceExpand !== undefined
        ? forceExpand
        : !list.every((e) => e.isExpanded);
    list.forEach((e) => (e.isExpanded = target));
  }

  function toggleAllEndpoints(forceExpand?: boolean) {
    toggleListExpand(uiConfig.value.endpoints, forceExpand);
  }

  function toggleAllPolicies(forceExpand?: boolean) {
    toggleListExpand(uiConfig.value.policies, forceExpand);
  }

  function toggleAllFilters(forceExpand?: boolean) {
    toggleListExpand(uiConfig.value.filters, forceExpand);
  }

  // ===========================================================================
  // 名称联动与防悬空引用更新
  // ===========================================================================

  function renameEndpointGroup(group: UIEndpointGroup, newName: string) {
    const oldName = group.name;
    const clean = newName.trim();
    if (!clean || clean === oldName) return;

    group.name = clean;
    // 联动策略组 order 中的 endpoint:<oldName>
    for (const p of uiConfig.value.policies) {
      if (Array.isArray(p.order)) {
        p.order = p.order.map((key) =>
          key === `endpoint:${oldName}` ? `endpoint:${clean}` : key,
        );
      }
    }
    markDirty();
  }

  function renamePolicy(policy: UIPolicy, newName: string) {
    const oldName = policy.name;
    const clean = newName.trim();
    if (!clean || clean === oldName) return;

    policy.name = clean;
    // 1. 联动策略组 order 中的 policy:<oldName>
    for (const p of uiConfig.value.policies) {
      if (Array.isArray(p.order)) {
        p.order = p.order.map((key) =>
          key === `policy:${oldName}` ? `policy:${clean}` : key,
        );
      }
    }
    // 2. 联动节点组的 parent
    for (const ep of uiConfig.value.endpoints) {
      if (ep.parent === oldName) ep.parent = clean;
    }
    // 3. 联动过滤规则 target
    for (const f of uiConfig.value.filters) {
      if (f.target === oldName) f.target = clean;
    }
    // 4. 联动 defaultTarget
    if (uiConfig.value.defaultTarget === oldName) {
      uiConfig.value.defaultTarget = clean;
    }
    markDirty();
  }

  // ===========================================================================
  // 实体快速增删
  // ===========================================================================

  function addEndpointGroup(kind: EndpointKind = "edge") {
    let baseName =
      kind === "edge" ? "外层组" : kind === "gateway" ? "出口组" : "加密组";
    let name = baseName;
    let counter = uiConfig.value.endpoints.length + 1;
    while (uiConfig.value.endpoints.some((e) => e.name === name)) {
      name = `${baseName}-${counter++}`;
    }

    const newGroup: UIEndpointGroup = {
      _uid: generateUid("endpoint"),
      name,
      kind,
      parent:
        kind === "edge" ? "" : uiConfig.value.policies[0]?.name || "",
      rawText: "",
      items: [],
      isExpanded: true,
    };

    uiConfig.value.endpoints.push(newGroup);
    markDirty();
    showToast(`已创建【${name}】`, "success");
  }

  function removeEndpointGroup(index: number) {
    const target = uiConfig.value.endpoints[index];
    if (!target) return;
    if (confirm(`确定要彻底删除节点组【${target.name}】吗？`)) {
      uiConfig.value.endpoints.splice(index, 1);
      // 清除各策略引用
      for (const p of uiConfig.value.policies) {
        if (Array.isArray(p.order)) {
          p.order = p.order.filter((k) => k !== `endpoint:${target.name}`);
        }
      }
      markDirty();
      showToast(`已删除节点组【${target.name}】`, "info");
    }
  }

  function addPolicy() {
    let name = `策略-${uiConfig.value.policies.length + 1}`;
    let counter = uiConfig.value.policies.length + 1;
    while (uiConfig.value.policies.some((p) => p.name === name)) {
      name = `策略-${counter++}`;
    }

    const newPolicy: UIPolicy = {
      _uid: generateUid("policy"),
      name,
      mode: "manual",
      order: ["direct"],
      testUrl: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      isExpanded: true, // 新增时展开
    };

    uiConfig.value.policies.push(newPolicy);
    markDirty();
    showToast(`已创建策略组【${name}】`, "success");
  }

  function removePolicy(index: number) {
    const target = uiConfig.value.policies[index];
    if (!target) return;
    if (confirm(`确定要彻底删除策略组【${target.name}】吗？`)) {
      uiConfig.value.policies.splice(index, 1);
      for (const p of uiConfig.value.policies) {
        if (Array.isArray(p.order)) {
          p.order = p.order.filter((k) => k !== `policy:${target.name}`);
        }
      }
      for (const ep of uiConfig.value.endpoints) {
        if (ep.parent === target.name) ep.parent = "";
      }
      for (const f of uiConfig.value.filters) {
        if (f.target === target.name) f.target = "DIRECT";
      }
      if (uiConfig.value.defaultTarget === target.name) {
        uiConfig.value.defaultTarget = "DIRECT";
      }
      markDirty();
      showToast(`已删除策略组【${target.name}】`, "info");
    }
  }

  function addFilter(kind: FilterKind = "remote") {
    let base = kind === "inline" ? "内置规则" : "远程规则";
    let name = `${base}-${uiConfig.value.filters.length + 1}`;
    let counter = uiConfig.value.filters.length + 1;
    while (uiConfig.value.filters.some((f) => f.name === name)) {
      name = `${base}-${counter++}`;
    }

    const newFilter: UIFilter = {
      _uid: generateUid("filter"),
      name,
      kind,
      behavior: kind === "inline" ? "mixed" : "domain",
      target: "DIRECT",
      enabled: true,
      url: kind === "remote" ? "" : undefined,
      interval: 86400,
      items: kind === "inline" ? ["DOMAIN-KEYWORD,example"] : undefined,
      isExpanded: true,
      viewMode: "list",
    };

    uiConfig.value.filters.push(newFilter);
    markDirty();
    showToast(`已创建规则集【${name}】`, "success");
  }

  function removeFilter(index: number) {
    const target = uiConfig.value.filters[index];
    if (!target) return;
    if (confirm(`确定要删除规则集【${target.name}】吗？`)) {
      uiConfig.value.filters.splice(index, 1);
      markDirty();
      showToast(`已删除【${target.name}】`, "info");
    }
  }

  return {
    workerBase,
    adminSecret,
    slug,
    userId,
    isConnected,
    isLoading,
    isRefreshing,
    errorMessage,
    activeTab,
    uiConfig,
    availableTargets,
    profileUrl,
    toastMessage,
    toastType,
    showToast,
    hasUnsavedChanges,
    markDirty,
    initCredentials,
    refreshConfig,
    refreshNodes,
    saveConfig,
    previewProfile,
    updateConnection,
    toggleAllEndpoints,
    toggleAllPolicies,
    toggleAllFilters,
    renameEndpointGroup,
    renamePolicy,
    addEndpointGroup,
    removeEndpointGroup,
    addPolicy,
    removePolicy,
    addFilter,
    removeFilter,
  };
});
