export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("arka_admin_token") || localStorage.getItem("arka_admin_token");
}

export function setStoredAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem("arka_admin_token", token);
    localStorage.setItem("arka_admin_token", token);
  } else {
    sessionStorage.removeItem("arka_admin_token");
    localStorage.removeItem("arka_admin_token");
  }
}

/**
 * Custom fetch wrapper for admin API calls that automatically includes
 * the x-admin-token header, ensuring sessions work across iframes,
 * previews, and third-party cookie restrictions.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredAdminToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has("x-admin-token")) {
    headers.set("x-admin-token", token);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
