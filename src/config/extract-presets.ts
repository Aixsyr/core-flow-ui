/**
 * 提取规则预设库
 * 仅包含指定规则，独立维护便于后续随时扩展新规则
 */

export interface ExtractPreset {
  id: string;
  label: string;
  description: string;
  patterns: string[];
  defaultNameTemplate?: string;
}

export const EXTRACT_PRESETS: ExtractPreset[] = [
  {
    id: "name-host-space-port",
    label: "名称 IP/域名 端口",
    description:
      "匹配空格分隔的「[名称] IP/域名 端口」（如：香港 1.2.3.4 443）",
    patterns: [
      "(?:^|\\n)\\s*(?:[^\\S\\r\\n]*\\S+[^\\S\\r\\n]+)?([a-zA-Z0-9._-]+)[^\\S\\r\\n]+(\\d+)",
    ],
    defaultNameTemplate: "$index-$1",
  },
  {
    id: "name-host-colon-port",
    label: "名称 IP/域名:端口",
    description:
      "匹配冒号分隔端口的「[名称] IP/域名:端口」（如：香港 1.2.3.4:443）",
    patterns: [
      "(?:^|\\n)\\s*(?:[^\\S\\r\\n]*\\S+[^\\S\\r\\n]+)?([a-zA-Z0-9._-]+):(\\d+)",
    ],
    defaultNameTemplate: "$index-$1",
  },
];
