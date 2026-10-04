import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const history =
    import.meta.env.VITE_GITHUB_PAGES === "1" && typeof window !== "undefined"
      ? createHashHistory()
      : undefined;
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    // GitHub Pages and the Android package share one folder of files.
    // Hash routes work there without a server. The preview stays on normal URLs.
    history,
  });
}
