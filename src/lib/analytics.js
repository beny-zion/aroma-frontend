const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Session ID - persists for browser session
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem('aroma_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('aroma_session_id', id);
  }
  return id;
}

// Event buffer for batching
let eventBuffer = [];
let flushTimer = null;

function flushEvents() {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];
  clearTimeout(flushTimer);
  flushTimer = null;

  const payload = JSON.stringify(batch);

  // Use sendBeacon for reliability (works on page unload)
  const sent = typeof navigator !== 'undefined' && navigator.sendBeacon?.(
    `${API_BASE}/analytics/track`,
    new Blob([payload], { type: 'application/json' })
  );

  // Fallback to fetch
  if (!sent) {
    fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include',
      keepalive: true
    }).catch(() => {});
  }
}

function getScreenResolution() {
  if (typeof window === 'undefined') return null;
  return `${window.screen.width}x${window.screen.height}`;
}

// Device fingerprint - unique per physical device (even on same network)
function getDeviceFingerprint() {
  if (typeof window === 'undefined') return null;
  try {
    const parts = [
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      window.devicePixelRatio || 1,
      navigator.language,
      navigator.hardwareConcurrency || 'x',
      navigator.maxTouchPoints || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform || ''
    ];
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return 'df_' + Math.abs(hash).toString(36);
  } catch {
    return null;
  }
}

export function trackEvent(type, data = {}) {
  if (typeof window === 'undefined') return;

  eventBuffer.push({
    type,
    sessionId: getSessionId(),
    screenResolution: getScreenResolution(),
    deviceFingerprint: getDeviceFingerprint(),
    timestamp: new Date().toISOString(),
    ...data
  });

  // Flush at 10 events or after 5 seconds
  if (eventBuffer.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, 5000);
  }
}

// Flush on page unload / tab hide
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushEvents);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEvents();
  });
}
