import { trackEvent } from "./admin.functions";
import type { FunnelStep } from "./admin.types";

const VISITOR_KEY = "selaria-visitor-id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Envia o evento sem bloquear a UI; falhas são silenciosas de propósito. */
export function track(step: FunnelStep, opts: { label?: string; value?: number } = {}): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  void trackEvent({
    data: {
      step,
      visitorId: getVisitorId(),
      path: window.location.pathname,
      label: opts.label,
      value: opts.value,
    },
  }).catch(() => undefined);
}
