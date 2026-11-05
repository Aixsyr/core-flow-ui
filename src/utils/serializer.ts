import type {
  Settings,
  EndpointGroup,
  Policy,
  Filter,
  UISettings,
  UIEndpointGroup,
  UIPolicy,
  UIFilter,
  EndpointItem,
  FallbackConfig,
} from "@/types/config";
import { formatNodesText, parseNodesText } from "./extractor";

let uidCounter = 0;
export function generateUid(prefix = "ui"): string {
  return `${prefix}_${Date.now()}_${++uidCounter}`;
}

/**
 * 将服务端配置转换为前端编辑状态
 */
export function fromBackendSettings(raw: Settings): UISettings {
  const endpoints: UIEndpointGroup[] = (raw.endpoints || []).map((group) => {
    const items: EndpointItem[] = Array.isArray(group.items)
      ? group.items.map((item) => ({ ...item }))
      : [];

    return {
      _uid: generateUid("endpoint"),
      name: group.name || "",
      kind: group.kind || "edge",
      parent: group.parent || "",
      rawText: formatNodesText(items, group.kind),
      items,
      isExpanded: false,
    };
  });

  const policies: UIPolicy[] = (raw.policies || []).map((policy) => ({
    _uid: generateUid("policy"),
    name: policy.name || "",
    mode: policy.mode || "manual",
    order: Array.isArray(policy.order) ? [...policy.order] : [],
    testUrl: policy.testUrl,
    interval: policy.interval,
    tolerance: policy.tolerance,
    isExpanded: false, // 全部默认折叠
  }));

  const filters: UIFilter[] = (raw.filters || []).map((filter) => ({
    _uid: generateUid("filter"),
    name: filter.name || "",
    kind: filter.kind || "remote",
    behavior: filter.behavior || "domain",
    target: filter.target || "DIRECT",
    enabled: typeof filter.enabled === "boolean" ? filter.enabled : true,
    url: filter.url,
    interval: typeof filter.interval === "number" && filter.interval >= 1 ? filter.interval : 86400,
    items: Array.isArray(filter.items) ? [...filter.items] : [],
    isExpanded: false, // 全部默认折叠
    viewMode: "list",
  }));

  const fallback: FallbackConfig = raw.fallback && typeof raw.fallback === "object"
    ? {
        enabled: Boolean(raw.fallback.enabled),
        timeoutMs:
          typeof raw.fallback.timeoutMs === "number"
            ? raw.fallback.timeoutMs
            : 3500,
        hosts: Array.isArray(raw.fallback.hosts) ? [...raw.fallback.hosts] : [],
      }
    : {
        enabled: false,
        timeoutMs: 3500,
        hosts: [],
      };

  return {
    defaultTarget: raw.defaultTarget || "DIRECT",
    fallback,
    endpoints,
    policies,
    filters,
  };
}

/**
 * 将前端状态序列化为标准 Settings 格式
 */
export function toBackendSettings(ui: UISettings): Settings {
  const endpoints: EndpointGroup[] = ui.endpoints.map((group) => {
    // parent 必填：无前置写 ""，edge 严格为 ""
    let parent = "";
    if (group.kind === "gateway" || group.kind === "wrapped") {
      parent = (group.parent || "").trim();
    }

    const parsed = parseNodesText(group.rawText || "", group.kind, group.name);
    const items: EndpointItem[] = parsed.map((item) => {
      const cleanNode: EndpointItem = {
        name: item.name ? item.name.trim() : group.name,
        host: item.host ? item.host.trim() : "",
        port: item.port ? Number(item.port) : 443,
      };

      if (group.kind === "wrapped") {
        cleanNode.transport = item.transport || "tcp";
        cleanNode.username = item.username || "";
        cleanNode.password = item.password || "";
        cleanNode.cipher = item.cipher || "";
        cleanNode.auth = item.auth || "";
        cleanNode.ca = item.ca || "";
        cleanNode.cert = item.cert || "";
        cleanNode.key = item.key || "";
      }

      return cleanNode;
    });

    const base: EndpointGroup = {
      name: group.name.trim(),
      kind: group.kind,
      parent,
      items,
    };

    return base;
  });

  const policies: Policy[] = ui.policies.map((p) => {
    const base: Policy = {
      name: p.name.trim(),
      mode: p.mode,
      order: (p.order || []).filter(Boolean),
    };

    if (p.mode === "probe" || p.mode === "failover") {
      base.testUrl = p.testUrl?.trim() || "http://www.gstatic.com/generate_204";
      base.interval = typeof p.interval === "number" && p.interval >= 1 ? p.interval : 300;
      base.tolerance = typeof p.tolerance === "number" && p.tolerance >= 0 ? p.tolerance : 50;
    }

    return base;
  });

  const filters: Filter[] = ui.filters.map((f) => {
    const interval = typeof f.interval === "number" && f.interval >= 1 ? f.interval : 86400;

    if (f.kind === "inline") {
      return {
        name: f.name.trim(),
        kind: "inline",
        behavior: f.behavior,
        target: f.target.trim() || "DIRECT",
        enabled: Boolean(f.enabled),
        items: (f.items || []).map((line) => line.trim()).filter(Boolean),
        interval,
      };
    } else {
      return {
        name: f.name.trim(),
        kind: "remote",
        behavior: f.behavior,
        target: f.target.trim() || "DIRECT",
        enabled: Boolean(f.enabled),
        url: f.url?.trim() || "",
        interval,
      };
    }
  });

  const fallback: FallbackConfig = {
    enabled: Boolean(ui.fallback?.enabled),
    timeoutMs: Math.max(
      100,
      Math.min(30000, Number(ui.fallback?.timeoutMs) || 3500),
    ),
    hosts: (ui.fallback?.hosts || []).map((h) => h.trim()).filter(Boolean),
  };

  const result: Settings = {
    defaultTarget: ui.defaultTarget.trim() || "DIRECT",
    fallback,
    endpoints,
    policies,
    filters,
  };

  return result;
}
