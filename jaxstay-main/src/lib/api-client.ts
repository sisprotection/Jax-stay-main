// Client-side helper to call our server routes with the user's Supabase JWT.
import { supabase } from "@/integrations/supabase/client";

export async function apiFetch(path: string, init: RequestInit = {}) {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  // Try refreshing once if the session is missing/expired.
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }

  if (!session?.access_token) {
    throw new Error("Not logged in: no Supabase session token found. Log out, log back in, and try again.");
  }

  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${session.access_token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers,
  });

  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      typeof body === "string"
        ? body || `Request failed (${res.status})`
        : body?.error || body?.message || `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return body;
}