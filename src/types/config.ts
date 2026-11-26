// 边缘服务配置数据模型契约定义

export type EndpointKind = "edge" | "gateway" | "wrapped";

export interface EndpointItem {
  name?: string;
  host: string;
  port?: number;
  transport?: string;
  username?: string;
  password?: string;
  cipher?: string;
  auth?: string;
  ca?: string;
  cert?: string;
  key?: string;
}

export interface EndpointGroup {
  name: string;
  kind: EndpointKind;
  parent: string;
  items: EndpointItem[];
}

export type PolicyMode = "manual" | "probe" | "failover";

export interface Policy {
  name: string;
  mode: PolicyMode;
  order: string[];
  testUrl?: string;
  interval?: number;
  tolerance?: number;
}

export type FilterKind = "inline" | "remote";
export type FilterBehavior = "mixed" | "domain" | "cidr";

export interface Filter {
  name: string;
  kind: FilterKind;
  behavior: FilterBehavior;
  target: string;
  enabled: boolean;
  interval: number;
  url?: string;
  items?: string[];
}

export interface FallbackConfig {
  enabled: boolean;
  timeoutMs: number;
  hosts: string[];
}

export interface MirrorHost {
  name: string;
  host: string;
  secret: string;
  enabled: boolean;
}

export interface Settings {
  defaultTarget: string;
  mirrors: MirrorHost[];
  fallback: FallbackConfig;
  endpoints: EndpointGroup[];
  policies: Policy[];
  filters: Filter[];
}

// =============================================================================
// 前端 UI 草稿扩展状态（纯前端内存使用，序列化存盘时严格剔除 _uid 等脏字段）
// =============================================================================

export interface UIEndpointGroup {
  _uid: string;
  name: string;
  kind: EndpointKind;
  parent: string;
  rawText: string;
  items: EndpointItem[];
  isExpanded: boolean;
}

export interface UIPolicy {
  _uid: string;
  name: string;
  mode: PolicyMode;
  order: string[];
  testUrl?: string;
  interval?: number;
  tolerance?: number;
  // 卡片是否展开（默认 false 折叠）
  isExpanded: boolean;
}

export interface UIFilter {
  _uid: string;
  name: string;
  kind: FilterKind;
  behavior: FilterBehavior;
  target: string;
  enabled: boolean;
  url?: string;
  interval?: number;
  items?: string[];
  // 卡片是否展开（默认 false 折叠）
  isExpanded: boolean;
  // 编辑模式：list（可视化列表）vs code（多行文本）
  viewMode?: "list" | "code";
}

export interface UIMirrorHost {
  _uid: string;
  name: string;
  host: string;
  secret: string;
  enabled: boolean;
}

export interface UISettings {
  defaultTarget: string;
  mirrors: UIMirrorHost[];
  fallback: FallbackConfig;
  endpoints: UIEndpointGroup[];
  policies: UIPolicy[];
  filters: UIFilter[];
}
