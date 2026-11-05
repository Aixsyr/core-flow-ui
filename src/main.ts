import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";
import { createPinia } from "pinia";
import router from "@/router";

// 引入 UnoCSS 样式与重置样式
import "@unocss/reset/tailwind.css";
import "virtual:uno.css";

import App from "./App.vue";

const app = createApp(App);

const head = createHead();
const pinia = createPinia();

app.use(head);
app.use(pinia);
app.use(router);

app.mount("#app");
