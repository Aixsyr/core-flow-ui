import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "@/pages/Dashboard.vue";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
    meta: {
      title: "Core Flow",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
