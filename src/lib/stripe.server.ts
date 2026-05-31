// Server-only Stripe helpers. Never import from client code.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  _stripe = new Stripe(key, {
    apiVersion: "2024-09-30.acacia" as never,
  });

  return _stripe;
}

export const PLATFORM_FEE_BPS = 1500; // 15%

export function computeFee(amountCents: number) {
  const fee = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);

  return {
    fee,
    sitterAmount: amountCents - fee,
  };
}

/**
 * Gets logged-in Supabase user from the Authorization Bearer token.
 * Used by Stripe server routes.
 */
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: new Response("Unauthorized: missing Authorization bearer token", {
        status: 401,
      }),
    };
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return {
      error: new Response("Unauthorized: empty bearer token", {
        status: 401,
      }),
    };
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return {
      error: new Response("Server missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY", {
        status: 500,
      }),
    };
  }

  const supabase = createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: undefined,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user?.id) {
    return {
      error: new Response(
        `Unauthorized: invalid Supabase session${error?.message ? ` - ${error.message}` : ""}`,
        {
          status: 401,
        }
      ),
    };
  }

  return {
    supabase,
    userId: data.user.id,
  };
}

/**
 * Admin Supabase client. Uses service role key and bypasses RLS.
 */
export function getAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: undefined,
    },
  });
}

/**
 * Gets current site origin for Stripe redirect URLs.
 */
export function getOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  return `${forwardedProto}://${host}`;
}