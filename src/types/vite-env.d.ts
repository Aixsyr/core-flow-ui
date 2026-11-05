/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<object, object, any>;
  export default component;
}

interface ImportMetaEnv {
  /** 应用标题 */
  readonly VITE_APP_TITLE: string;
  /** API 基础服务地址 */
  readonly VITE_API_BASE_URL: string;
  /** 是否启用本地 Mock ("true" | "false") */
  readonly VITE_USE_MOCK: string;
  /** 当前版本号 (由 package.json 自动注入) */
  readonly VITE_APP_VERSION: string;
  /** 生产构建时间戳 (毫秒) */
  readonly VITE_APP_BUILD_EPOCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
