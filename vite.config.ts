import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// 导入 Vue 插件，用于处理 .vue 文件
import vue from "@vitejs/plugin-vue";
// 导入 Vue 官方 DevTools 开发者工具插件
import VueDevTools from "vite-plugin-vue-devtools";
// 导入 UnoCSS 插件
import UnoCSS from "unocss/vite";
// 导入自动导入插件，用于自动导入常用 API
import AutoImport from "unplugin-auto-import/vite";
// 导入组件自动导入插件，用于自动导入组件
import Components from "unplugin-vue-components/vite";

// 导入 package.json 文件以获取版本信息 (使用标准 import attributes)
import PackageJson from "./package.json" with { type: "json" };
// 导入 postcss 插件
import postcssPlugins from "./postcss.config";

const port = 5400;

// 设置应用版本环境变量，供应用内部使用
process.env.VITE_APP_VERSION = PackageJson.version;
// 在生产环境中设置构建时间戳环境变量
if (process.env.NODE_ENV === "production") {
  process.env.VITE_APP_BUILD_EPOCH = new Date().getTime().toString();
}

// 导出 Vite 配置
export default defineConfig(() => {
  return {
    base: "./",

    plugins: [
      vue(),
      // Vue DevTools 调试面板
      VueDevTools(),
      // UnoCSS 引擎插件
      UnoCSS(),
      // 自动导入插件配置
      AutoImport({
        imports: [
          "vue",
          "vue-router",
          "pinia",
          "@vueuse/core",
          {
            "@/store/index": ["useStore"],
            "@unhead/vue": ["useHead"],
          },
        ],
        dts: "./src/types/auto-imports.d.ts",
        vueTemplate: true,
      }),
      // 组件自动导入插件
      Components({
        dts: "./src/types/components.d.ts",
      }),
    ],

    css: {
      // 启用多核多线程并行处理 CSS 预处理，提升构建效率
      preprocessorMaxWorkers: true as const,
      postcss: {
        plugins: postcssPlugins,
      },
    },

    server: {
      port: port,
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "~": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
  };
});
