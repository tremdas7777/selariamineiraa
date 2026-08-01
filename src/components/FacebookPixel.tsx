import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getPublicPixel } from "@/lib/admin.functions";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

/**
 * Carrega o Facebook Pixel usando o ID configurado no painel admin.
 * Não renderiza nada; falhas são silenciosas para nunca quebrar a loja.
 */
export function FacebookPixel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchPixel = useServerFn(getPublicPixel);
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ["fb-pixel"],
    queryFn: () => fetchPixel(),
    staleTime: 5 * 60_000,
  });

  const pixelId = data?.pixelId ?? "";

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || initialized.current) return;
    initialized.current = true;
    try {
      /* snippet oficial do fbq, em versão enxuta */
      const fbq: Window["fbq"] = function (...args: unknown[]) {
        (fbq as { queue: unknown[] }).queue.push(args);
      } as NonNullable<Window["fbq"]>;
      (fbq as { queue: unknown[] }).queue = [];
      window.fbq = window.fbq ?? fbq;
      window._fbq = window._fbq ?? window.fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);

      window.fbq?.("init", pixelId);
      window.fbq?.("track", "PageView");
    } catch {
      /* ignora: rastreamento não pode derrubar a página */
    }
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || !initialized.current) return;
    window.fbq?.("track", "PageView");
  }, [pathname, pixelId]);

  return null;
}
