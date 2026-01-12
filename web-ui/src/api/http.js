async function parseBody(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function joinUrl(base, path) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function apiFetch(service, path, options = {}) {
  const AUTH = import.meta.env.VITE_AUTH_BASE_URL;
  const ACCOUNT = import.meta.env.VITE_ACCOUNT_BASE_URL;
  const ADMIN = import.meta.env.VITE_ADMIN_BASE_URL; // ✅ NUEVO

  const baseUrl =
    service === "auth" ? AUTH :
    service === "account" ? ACCOUNT :
    service === "admin" ? ADMIN :
    null;

  if (!baseUrl) throw new Error(`Base URL no definida para service="${service}"`);

  const token = sessionStorage.getItem("jwt");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(joinUrl(baseUrl, path), {
    ...options,
    headers,
  });

  const data = await parseBody(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}
