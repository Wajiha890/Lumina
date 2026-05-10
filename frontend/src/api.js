// Lumina – MSc Cloud Computing Project
const bases = [];

function pushBase(u) {
  if (typeof u === "string" && u.trim()) {
    const b = u.trim().replace(/\/$/, "");
    if (!bases.includes(b)) bases.push(b);
  }
}

const viteBase = import.meta.env?.VITE_API_BASE;
if (typeof viteBase === "string" && viteBase.trim()) {
  pushBase(viteBase);
}
if (typeof window !== "undefined" && window.__PX_API_BASE__) {
  pushBase(window.__PX_API_BASE__);
}
["http://127.0.0.1:5010", "http://127.0.0.1:5001", "http://127.0.0.1:5000"].forEach(pushBase);

export async function apiFetch(path, options = {}) {
  for (const base of bases) {
    try {
      const res = await fetch(base + path, options);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      continue;
    }
  }
  return {
    ok: false,
    status: 0,
    data: {
      message:
        "Cannot reach API. Set VITE_API_BASE or window.__PX_API_BASE__ (see README).",
    },
  };
}
