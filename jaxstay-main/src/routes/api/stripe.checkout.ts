import { createFileRoute } from "@tanstack/react-router";
import {
  getStripe,
  getUserFromRequest,
  getOrigin,
  computeFee,
  getAdmin,
} from "@/lib/stripe.server";
import {
  computeTransportQuote,
  type TierPrices,
} from "@/lib/transport-pricing";
import type { DistanceTierKey, TripTypeKey } from "@/data/city-coords";

type BookingRow = {
  id: string;
  owner_id: string;
  sitter_id: string;
  status: string | null;
  payment_status: string | null;
  service: string | null;
  service_category?: string | null;
  start_date: string | null;
  end_date: string | null;
  updated_at?: string | null;

  trip_type?: TripTypeKey | null;
  distance_tier?: DistanceTierKey | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  pickup_datetime?: string | null;
  return_datetime?: string | null;
  extra_stops?: number | null;
  waiting_hours?: number | null;
};

type SitterRow = {
  id: string;
  full_name: string | null;
  sitter_rate: number | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;

  sitter_transport_enabled?: boolean | null;
  sitter_transport_prices_by_tier?: Record<string, unknown> | null;
  sitter_extra_stop_fee_cents?: number | null;
  sitter_waiting_fee_per_hour_cents?: number | null;
};

function normalizeTierPrices(raw: Record<string, unknown> | null | undefined): TierPrices {
  const source = raw ?? {};
  const out: Record<string, number> = {};

  const aliases: Record<string, string[]> = {
    tier_0_5: ["tier_0_5", "0-5", "0_5", "0–5"],
    tier_6_15: ["tier_6_15", "6-15", "6_15", "6–15"],
    tier_16_30: ["tier_16_30", "16-30", "16_30", "16–30"],
    tier_31_50: ["tier_31_50", "31-50", "31_50", "31–50"],
    tier_50_plus: ["tier_50_plus", "50+", "50_plus", "50-plus"],
  };

  for (const [canonical, keys] of Object.entries(aliases)) {
    for (const key of keys) {
      const value = source[key];

      if (value == null || value === "") continue;

      const num = Number(value);

      if (Number.isFinite(num) && num > 0) {
        out[canonical] = num;
        break;
      }
    }
  }

  return out as TierPrices;
}

function numberOrZero(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function response(message: string, status = 400) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await getUserFromRequest(request);

          if ("error" in auth) {
            return auth.error;
          }

          const { userId } = auth;
          const admin = getAdmin();

          const { bookingId } = (await request.json().catch(() => ({}))) as {
            bookingId?: string;
          };

          if (!bookingId) {
            return response("bookingId required");
          }

          const { data: bookingData, error: bookingError } = await admin
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .maybeSingle();

          if (bookingError) {
            return response(`Booking lookup failed: ${bookingError.message}`, 500);
          }

          if (!bookingData) {
            return response("Booking not found", 404);
          }

          const booking = bookingData as BookingRow;

          if (booking.owner_id !== userId) {
            return response("Only the owner can pay", 403);
          }

          if (booking.status !== "awaiting_payment") {
            return response(`Booking is ${booking.status}, not awaiting_payment`);
          }

          if (booking.payment_status === "paid") {
            return response("Already paid");
          }

          const { data: sitterData, error: sitterError } = await admin
            .from("profiles")
            .select(
              `
              id,
              full_name,
              sitter_rate,
              stripe_account_id,
              stripe_charges_enabled,
              stripe_payouts_enabled,
              sitter_transport_enabled,
              sitter_transport_prices_by_tier,
              sitter_extra_stop_fee_cents,
              sitter_waiting_fee_per_hour_cents
            `,
            )
            .eq("id", booking.sitter_id)
            .maybeSingle();

          if (sitterError) {
            return response(`Sitter lookup failed: ${sitterError.message}`, 500);
          }

          if (!sitterData) {
            return response("Sitter not found", 404);
          }

          const sitter = sitterData as SitterRow;

          if (
            !sitter.stripe_account_id ||
            !sitter.stripe_charges_enabled ||
            !sitter.stripe_payouts_enabled
          ) {
            return response("Sitter has not finished payout setup yet");
          }

          const isTransport = booking.service_category === "transport";

          let amountCents: number;
          let lineName: string;
          let lineDesc: string;

          if (isTransport) {
            if (!sitter.sitter_transport_enabled) {
              return response("Sitter does not offer transport");
            }

            if (!booking.trip_type || !booking.distance_tier) {
              return response("Missing transport details");
            }

            const prices = normalizeTierPrices(sitter.sitter_transport_prices_by_tier);

            const extraStops = numberOrZero(booking.extra_stops);
            const waitingHours = numberOrZero(booking.waiting_hours);

            if (extraStops > 20) {
              return response("Extra stops is too high. Please use 20 or fewer.");
            }

            if (waitingHours > 24) {
              return response("Waiting hours is too high. Please use 24 or fewer.");
            }

            const quote = computeTransportQuote({
              tripType: booking.trip_type,
              tier: booking.distance_tier,
              prices,
              extraStops,
              extraStopFeeCents: sitter.sitter_extra_stop_fee_cents ?? null,
              waitingHours,
              waitingFeePerHourCents:
                sitter.sitter_waiting_fee_per_hour_cents ?? null,
            });

            if (quote.totalCents <= 0) {
              return response(
                `Sitter has no price for this transport tier: ${booking.distance_tier}`,
              );
            }

            amountCents = Math.round(quote.totalCents);

            lineName = "Pet Transportation Service";
            lineDesc = `${booking.trip_type.replaceAll("_", " ")} · ${booking.distance_tier} · with ${
              sitter.full_name ?? "JaxStay sitter"
            }`;
          } else {
            if (!sitter.sitter_rate) {
              return response("Sitter rate is not set");
            }

            if (!booking.start_date || !booking.end_date) {
              return response("Booking dates are missing");
            }

            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);

            const nights = Math.max(
              1,
              Math.round(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
              ),
            );

            amountCents = Math.round(sitter.sitter_rate * 100 * nights);

            lineName = `${booking.service ?? "Booking"} with ${
              sitter.full_name ?? "JaxStay sitter"
            }`;
            lineDesc = `${nights} night${nights > 1 ? "s" : ""} · ${
              booking.start_date
            } → ${booking.end_date}`;
          }

          if (!Number.isFinite(amountCents) || amountCents <= 0) {
            return response("Invalid amount");
          }

          if (amountCents < 50) {
            return response("Stripe requires at least $0.50 for checkout.");
          }

          if (amountCents > 99999999) {
            return response("Amount is too high for Stripe checkout.");
          }

          const { fee } = computeFee(amountCents);

          const stripe = getStripe();
          const origin = getOrigin(request);

          const session = await stripe.checkout.sessions.create(
            {
              mode: "payment",
              payment_method_types: ["card"],
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency: "usd",
                    unit_amount: amountCents,
                    product_data: {
                      name: lineName,
                      description: lineDesc,
                    },
                  },
                },
              ],
              payment_intent_data: {
                transfer_group: `booking_${booking.id}`,
                metadata: {
                  booking_id: booking.id,
                  sitter_id: booking.sitter_id,
                  owner_id: booking.owner_id,
                },
              },
              success_url: `${origin}/bookings?paid=${booking.id}`,
              cancel_url: `${origin}/bookings?cancel=${booking.id}`,
              metadata: {
                booking_id: booking.id,
                sitter_id: booking.sitter_id,
                owner_id: booking.owner_id,
              },
            },
            {
              idempotencyKey: `checkout:${booking.id}:${booking.updated_at ?? ""}`,
            },
          );

          const { error: updateError } = await admin
            .from("bookings")
            .update({
              stripe_checkout_session_id: session.id,
              amount_cents: amountCents,
              platform_fee_cents: fee,
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", booking.id);

          if (updateError) {
            return response(
              `Checkout created but booking update failed: ${updateError.message}`,
              500,
            );
          }

          return Response.json({
            url: session.url,
          });
        } catch (error) {
          return response(
            error instanceof Error
              ? `Stripe checkout error: ${error.message}`
              : "Unknown Stripe checkout error",
            500,
          );
        }
      },
    },
  },
});