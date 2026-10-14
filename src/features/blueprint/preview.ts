/**
 * The blueprint bench is a client-sharing prototype, not a product route.
 * It renders in local dev, in Vercel preview deployments (*.vercel.app),
 * or when VITE_BLUEPRINT_PREVIEW is "1". It never renders on the
 * production custom domain, which is not a vercel.app host.
 */
export function isBlueprintPreviewAvailable(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_BLUEPRINT_PREVIEW === "1") return true;
  if (typeof window !== "undefined" && /(^|\.)vercel\.app$/i.test(window.location.hostname)) {
    return true;
  }
  return false;
}
