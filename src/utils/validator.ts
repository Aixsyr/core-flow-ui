import type { UISettings } from "@/types/config";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 本地配置合法性预检
 */
export function validateSettings(ui: UISettings): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 节点组校验
  const groupNames = new Set<string>();
  for (const group of ui.endpoints) {
    const name = group.name.trim();
    if (!name) {
      errors.push("存在未命名的节点组");
      continue;
    }
    if (groupNames.has(name)) {
      errors.push(`节点组名称重复: 【${name}】`);
    }
    groupNames.add(name);

    if (group.kind === "gateway" && !group.parent?.trim()) {
      errors.push(`出口节点组【${name}】必须配置前置策略 (parent)`);
    }
  }

  // 2. 策略组校验
  const policyNames = new Set<string>();
  const policyMap = new Map<string, string[]>();

  for (const policy of ui.policies) {
    const name = policy.name.trim();
    if (!name) {
      errors.push("存在未命名的策略组");
      continue;
    }
    if (policyNames.has(name)) {
      errors.push(`策略组名称重复: 【${name}】`);
    }
    policyNames.add(name);

    const subPolicies: string[] = [];
    for (const key of policy.order || []) {
      if (key.startsWith("policy:")) {
        subPolicies.push(key.slice("policy:".length));
      } else if (key.startsWith("endpoint:")) {
        const targetGroup = key.slice("endpoint:".length);
        if (!groupNames.has(targetGroup)) {
          warnings.push(`策略【${name}】引用了不存在的节点组: ${targetGroup}`);
        }
      }
    }
    policyMap.set(name, subPolicies);

    if (!policy.order || policy.order.length === 0) {
      warnings.push(`策略组【${name}】未选择任何候选出站项`);
    }
  }

  // 环路检测 (A -> B -> A)
  const visited = new Map<string, "visiting" | "done">();
  const checkCycle = (curr: string, trail: string[]) => {
    const state = visited.get(curr);
    if (state === "done") return;
    if (state === "visiting") {
      errors.push(`策略组引用成环: ${[...trail, curr].join(" → ")}`);
      return;
    }
    visited.set(curr, "visiting");
    for (const sub of policyMap.get(curr) || []) {
      if (policyNames.has(sub)) {
        checkCycle(sub, [...trail, curr]);
      }
    }
    visited.set(curr, "done");
  };

  for (const pName of policyNames) {
    checkCycle(pName, []);
  }

  // parent 自指检测
  for (const group of ui.endpoints) {
    if (group.parent) {
      const parentPolicy = ui.policies.find((p) => p.name === group.parent);
      if (
        parentPolicy &&
        parentPolicy.order?.includes(`endpoint:${group.name}`)
      ) {
        errors.push(
          `前置策略【${group.parent}】不能包含自身节点组【${group.name}】`,
        );
      }
    }
  }

  // 3. 分流规则集校验
  const filterNames = new Set<string>();
  for (const filter of ui.filters) {
    const name = filter.name.trim();
    if (!name) {
      errors.push("存在未命名的分流规则集");
      continue;
    }
    if (filterNames.has(name)) {
      errors.push(`分流规则集名称重复: 【${name}】`);
    }
    filterNames.add(name);

    if (
      filter.target !== "DIRECT" &&
      filter.target !== "REJECT" &&
      !policyNames.has(filter.target)
    ) {
      errors.push(`规则集【${name}】导向的目标策略不存在: ${filter.target}`);
    }

    if (filter.kind === "remote" && !filter.url?.trim()) {
      errors.push(`远程规则集【${name}】缺少 URL`);
    }
  }

  // 4. 默认规则校验
  if (
    ui.defaultTarget !== "DIRECT" &&
    ui.defaultTarget !== "REJECT" &&
    !policyNames.has(ui.defaultTarget)
  ) {
    errors.push(
      `默认规则 (MATCH) 指向了未知的策略: 【${ui.defaultTarget}】`,
    );
  }

  // 5. 回退策略 (fallback) 校验
  if (ui.fallback && ui.fallback.enabled) {
    const timeout = Number(ui.fallback.timeoutMs);
    if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30000) {
      errors.push("回退策略的超时时间 (timeoutMs) 必须在 100 - 30000 ms 之间");
    }
    const hosts = (ui.fallback.hosts || [])
      .map((h) => h.trim())
      .filter(Boolean);
    if (hosts.length === 0) {
      errors.push("启用回退策略时，回退地址池 (hosts) 不能为空");
    } else {
      for (const h of hosts) {
        const match =
          h.match(/^\[([^\]]+)\]:(\d+)$/) ?? h.match(/^([^:]+):(\d+)$/);
        if (!match) {
          errors.push(`回退地址格式错误: "${h}"，必须写成 host:port`);
        } else {
          const port = Number.parseInt(match[2], 10);
          if (!Number.isInteger(port) || port < 1 || port > 65535) {
            errors.push(`回退地址端口非法: "${h}"`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
