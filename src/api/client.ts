import type { Settings } from "@/types/config";

/**
 * 封装带 slug 路由前缀的 HTTP 客户端
 */
export class CoreClient {
  private workerBase: string;
  private slug: string;

  constructor(workerBase: string, slug: string) {
    this.workerBase = workerBase.replace(/\/+$/, "");
    this.slug = slug.replace(/^\/+|\/+$/g, "");
  }

  private getUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, "");
    return `${this.workerBase}/${this.slug}/${cleanPath}`;
  }

  /**
   * 读取完整配置
   */
  async getSettings(): Promise<Settings> {
    const res = await fetch(this.getUrl("api/settings"), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      let errorMsg = `连接失败 (HTTP ${res.status})，请检查域名与密钥是否匹配`;
      try {
        const json = await res.json();
        if (json.error) errorMsg = json.error;
      } catch {}
      throw new Error(errorMsg);
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || "获取配置数据失败");
    }
    return json.data;
  }

  /**
   * 整份保存配置
   */
  async saveSettings(settings: Settings): Promise<boolean> {
    const res = await fetch(this.getUrl("api/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      let errorMsg = `保存失败 (HTTP ${res.status})`;
      try {
        const json = await res.json();
        if (json.error) errorMsg = json.error;
      } catch {}
      throw new Error(errorMsg);
    }
    const json = await res.json();
    return json.success === true;
  }

  /**
   * 触发解析 Worker 刷新节点
   */
  async refreshNodes(): Promise<boolean> {
    const res = await fetch(this.getUrl("api/nodes/refresh"), {
      method: "POST",
    });
    if (!res.ok) {
      let errorMsg = `节点刷新失败 (HTTP ${res.status})`;
      try {
        const json = await res.json();
        if (json.error) errorMsg = json.error;
      } catch {}
      throw new Error(errorMsg);
    }
    const json = await res.json();
    return json.success === true;
  }

  /**
   * 拉取生成的客户端配置文本
   */
  async getProfile(): Promise<string> {
    const res = await fetch(this.getUrl("profile"));
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `拉取配置失败 (HTTP ${res.status})`);
    }
    return await res.text();
  }
}
