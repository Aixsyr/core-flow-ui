import type { UIEndpointGroup, UIMirrorHost } from "@/types/config";
import { parseNodesText } from "./extractor";

export interface EndpointOption {
  name: string;
  count: number;
  isDerived: boolean;
  sourceGroup?: string;
  mirrorName?: string;
  enabled?: boolean;
}

export function deriveMirrorGroupName(
  groupName: string,
  mirrorName: string,
): string {
  return `${groupName}-${mirrorName}`;
}

export function normalizeMirrorHost(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

/**
 * 统一计算当前所有可用节点组（原始组 + 由 edge 组与 mirrors 派生出的镜像组）。
 * 策略列表展示、全选、本地校验与联动清理均消费同一份清单。
 */
export function getAllEndpointOptions(
  endpoints: UIEndpointGroup[],
  mirrors: UIMirrorHost[],
): EndpointOption[] {
  const options: EndpointOption[] = [];

  for (const group of endpoints) {
    const name = group.name.trim();
    if (!name) continue;
    const count = parseNodesText(group.rawText || "", group.kind, name).length;
    options.push({
      name,
      count,
      isDerived: false,
    });
  }

  for (const group of endpoints) {
    if (group.kind !== "edge") continue;
    const groupName = group.name.trim();
    if (!groupName) continue;
    const count = parseNodesText(
      group.rawText || "",
      group.kind,
      groupName,
    ).length;

    for (const mirror of mirrors) {
      const mirrorName = mirror.name.trim();
      if (!mirrorName) continue;
      options.push({
        name: deriveMirrorGroupName(groupName, mirrorName),
        count: mirror.enabled ? count : 0,
        isDerived: true,
        sourceGroup: groupName,
        mirrorName,
        enabled: mirror.enabled,
      });
    }
  }

  return options;
}
