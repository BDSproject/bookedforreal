/** Client-side API client (Bearer token from localStorage). Use in "use client" components only. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}
