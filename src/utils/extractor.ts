import type { EndpointItem, EndpointKind } from "@/types/config";

/**
 * 解析单行纯文本节点
 * 1. 分号切分（首选标准格式）：
 *    - edge / gateway: "名称;host;port"
 *    - wrapped: "名称;host;port;transport;username;password;cipher;auth;ca;cert;key"
 * 2. 兼容历史空格切分
 */
export function parseNodeLine(
  line: string,
  kind: EndpointKind = "edge",
  defaultNamePrefix = "node",
): EndpointItem | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return null;
  }

  // 1. 优先按分号切分
  if (trimmed.includes(";")) {
    const parts = trimmed.split(";").map((p) => p.trim());

    if (kind === "wrapped") {
      if (parts.length >= 3) {
        const name = parts[0] || defaultNamePrefix;
        const host = parts[1] || "";
        const port = Number.parseInt(parts[2], 10) || 443;
        const transport = parts[3] || "tcp";
        const username = parts[4] || "";
        const password = parts[5] || "";
        const cipher = parts[6] || "";
        const auth = parts[7] || "";
        const ca = (parts[8] || "").replace(/\\n/g, "\n");
        const cert = (parts[9] || "").replace(/\\n/g, "\n");
        const key = (parts[10] || "").replace(/\\n/g, "\n");

        return {
          name,
          host,
          port,
          transport,
          username,
          password,
          cipher,
          auth,
          ca,
          cert,
          key,
        };
      }
    }

    if (parts.length >= 2) {
      let name = parts[0];
      let host = parts[1];
      let port = 443;

      if (parts.length >= 3) {
        port = Number.parseInt(parts[2], 10) || 443;
      } else {
        const hp = host.match(/^\[?([^\]]+)\]?:(\d+)$/);
        if (hp) {
          host = hp[1];
          port = Number.parseInt(hp[2], 10) || 443;
        }
      }

      return {
        name: name || defaultNamePrefix,
        host,
        port,
      };
    }
  }

  // 2. 兼容历史空格/冒号切分
  let match = trimmed.match(/^(\S+)\s+([a-zA-Z0-9._-]+):(\d+)$/);
  if (match) {
    return {
      name: match[1],
      host: match[2],
      port: Number.parseInt(match[3], 10),
    };
  }

  match = trimmed.match(/^(\S+)\s+([a-zA-Z0-9._-]+)\s+(\d+)$/);
  if (match) {
    return {
      name: match[1],
      host: match[2],
      port: Number.parseInt(match[3], 10),
    };
  }

  match = trimmed.match(/^([a-zA-Z0-9._-]+):(\d+)$/);
  if (match) {
    return {
      name: defaultNamePrefix ? `${defaultNamePrefix}-${match[1]}` : match[1],
      host: match[1],
      port: Number.parseInt(match[2], 10),
    };
  }

  match = trimmed.match(/^([a-zA-Z0-9._-]+)\s+(\d+)$/);
  if (match) {
    return {
      name: defaultNamePrefix ? `${defaultNamePrefix}-${match[1]}` : match[1],
      host: match[1],
      port: Number.parseInt(match[2], 10),
    };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    if (/^\d+$/.test(last)) {
      const name =
        parts.slice(0, parts.length - 2).join(" ") ||
        (defaultNamePrefix ? `${defaultNamePrefix}-${secondLast}` : secondLast);
      return {
        name,
        host: secondLast,
        port: Number.parseInt(last, 10),
      };
    }
  }

  return null;
}

/**
 * 将整段多行文本解析为 EndpointItem 数组（只裁切头尾空行，保留中间所有行）
 */
export function parseNodesText(
  rawText: string,
  kind: EndpointKind = "edge",
  defaultNamePrefix = "node",
): EndpointItem[] {
  if (!rawText) return [];

  const lines = rawText.split("\n");
  let firstIdx = -1;
  let lastIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }
  }

  if (firstIdx === -1) return [];

  const items: EndpointItem[] = [];
  for (let i = firstIdx; i <= lastIdx; i++) {
    const node = parseNodeLine(lines[i], kind, defaultNamePrefix);
    if (node) {
      items.push(node);
    }
  }
  return items;
}

/**
 * 将单个节点格式化为分号纯文本行
 */
export function formatNodeLine(
  node: EndpointItem,
  kind: EndpointKind = "edge",
): string {
  const host = node.host?.trim() || "";
  if (!host) return "";
  const name = node.name?.trim() || "";
  const port = node.port || 443;

  if (kind === "wrapped") {
    const transport = node.transport || "tcp";
    const username = node.username || "";
    const password = node.password || "";
    const cipher = node.cipher || "";
    const auth = node.auth || "";
    const ca = (node.ca || "").replace(/\r?\n/g, "\\n");
    const cert = (node.cert || "").replace(/\r?\n/g, "\\n");
    const key = (node.key || "").replace(/\r?\n/g, "\\n");
    return `${name};${host};${port};${transport};${username};${password};${cipher};${auth};${ca};${cert};${key}`;
  }

  return `${name};${host};${port}`;
}

/**
 * 将节点数组格式化为纯文本字符串（每行分号隔开）
 */
export function formatNodesText(
  nodes: EndpointItem[],
  kind: EndpointKind = "edge",
): string {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";
  return nodes.map((n) => formatNodeLine(n, kind)).filter(Boolean).join("\n");
}

// =============================================================================
// 分流规则行编解码器
// =============================================================================

export const RULE_TYPES = [
  { label: "域名后缀 (DOMAIN-SUFFIX)", value: "DOMAIN-SUFFIX" },
  { label: "域名关键字 (DOMAIN-KEYWORD)", value: "DOMAIN-KEYWORD" },
  { label: "完整域名 (DOMAIN)", value: "DOMAIN" },
  { label: "IPv4网段 (IP-CIDR)", value: "IP-CIDR" },
  { label: "IPv6网段 (IP-CIDR6)", value: "IP-CIDR6" },
  { label: "国家代号 (GEOIP)", value: "GEOIP" },
  { label: "源IP网段 (SRC-IP-CIDR)", value: "SRC-IP-CIDR" },
  { label: "目标端口 (DST-PORT)", value: "DST-PORT" },
  { label: "全匹配 (MATCH)", value: "MATCH" },
] as const;

export function parseRuleLine(line: string): { type: string; value: string } {
  const trimmed = (line || "").trim();
  if (!trimmed) return { type: "DOMAIN-KEYWORD", value: "" };
  const firstComma = trimmed.indexOf(",");
  if (firstComma === -1) {
    return { type: "DOMAIN-KEYWORD", value: trimmed };
  }
  const type = trimmed.slice(0, firstComma).trim() || "DOMAIN-KEYWORD";
  const val = trimmed.slice(firstComma + 1).trim();
  return { type, value: val };
}

export function formatRuleLine(type: string, value: string): string {
  return `${type.trim()},${value.trim()}`;
}
