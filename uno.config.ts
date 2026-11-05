import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";
import mdi from "@iconify-json/mdi/icons.json" with { type: "json" };
import svgSpinners from "@iconify-json/svg-spinners/icons.json" with { type: "json" };

export default defineConfig({
  presets: [
    // 兼容 Tailwind CSS 语法的 UnoCSS 预设
    presetWind3(),
    // 纯 CSS 图标预设
    presetIcons({
      // 图标微调缩放比 (与中文字体对齐视觉更和谐)
      scale: 1.2,
      // 尺寸单位跟随父级文字大小自适应 (例如 text-sm, text-2xl)
      unit: "em",
      // 开发阶段图标缺失时打印警告
      warn: true,
      // 默认渲染属性
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
      collections: {
        mdi: () => mdi,
        "svg-spinners": () => svgSpinners,
      },
    }),
    // 排版预设 (prose 类)
    presetTypography(),
  ],
  transformers: [
    // 支持 @apply、theme()
    transformerDirectives(),
    // 支持属性变体分组: hover:(bg-teal-400 font-medium)
    transformerVariantGroup(),
  ],
  // 全局常用复合类
  shortcuts: {
    // 弹性水平垂直居中
    "flex-center": "flex justify-center items-center",
  },
});
