import "vue-router";
import type { Router } from "vue-router";
import "pinia";

export {};

declare module "vue-router" {
  interface RouteMeta {
    /**
     * 路由页面标题
     */
    title?: string;
  }
}

declare module "pinia" {
  export interface PiniaCustomProperties {
    /**
     * Pinia 扩展的 Vue Router 实例
     */
    router: Router;
  }
}
