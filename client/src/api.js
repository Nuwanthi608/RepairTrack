const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "rt_token";
const USER_KEY = "rt_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  // Token එක expire වෙලා නම් login page එකට යවනවා
  if (res.status === 401 && options.auth !== false) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const STATUS_LABELS = {
  received: "Received",
  diagnosing: "Diagnosing",
  waiting_for_parts: "Waiting for parts",
  repairing: "Repairing",
  ready: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const formatRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export const formatDate = (d) => (d ? new Date(d).toLocaleString("en-LK") : "-");