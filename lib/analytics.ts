// Minimal, dependency-free product analytics.
//
// This exists so we can actually answer "does the funnel convert?" — landing →
// signup → activation → export → upgrade. It sends custom events to PostHog's
// HTTP capture endpoint and is a complete no-op unless NEXT_PUBLIC_POSTHOG_KEY
// is set, so the site builds and runs identically with or without a key.
//
// We deliberately avoid the posthog-js SDK: no extra bundle weight, no CDN
// script, no cookie banner surface beyond what we already disclose. Events are
// fire-and-forget via sendBeacon (falling back to keepalive fetch).

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// EU region by default — the product and its users are EU-based (DSGVO).
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

const DID_STORAGE_KEY = "th_did";

// A stable, anonymous per-browser id so PostHog can stitch a session's events
// into one funnel. Not tied to any personal data.
function distinctId(): string {
  try {
    let id = localStorage.getItem(DID_STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked — fall back to an ephemeral id.
    return `anon_${Date.now()}`;
  }
}

/**
 * Record a product event. Safe to call from anywhere on the client; no-ops on
 * the server and when no PostHog key is configured.
 */
export function track(
  event: string,
  properties: Record<string, unknown> = {},
): void {
  if (!KEY || typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: distinctId(),
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        $current_url: window.location.href,
        $pathname: window.location.pathname,
        $referrer: document.referrer || undefined,
      },
    });
    const url = `${HOST}/capture/`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the app */
  }
}
