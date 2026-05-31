import { createFileRoute } from "@tanstack/react-router";
import { getAdmin, getStripe, getUserFromRequest } from "@/lib/stripe.server";

type BookingForPayout = {
  id: string;
  owner_id: string;
  sitter_id: string;
  status: string | null;
  payment_status: string | null;
  amount_cents: number | null;
  platform_fee_cents: number | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id?: string | null;
  payout_released: boolean | null;
  client_completed_at?: string | null;
  sitter_completed_at?: string | null;
  completed_at?: string | null;
};

async function fillMissingPaymentData(booking: BookingForPayout) {
  if (booking.amount_cents && booking.stripe_payment_intent_id) {
    return booking;
  }

  const stripe = getStripe();
  const admin = getAdmin();

  let paymentIntentId = booking.stripe_payment_intent_id ?? null;
  let amountCents = booking.amount_cents ?? null;

  if (!paymentIntentId && booking.stripe_checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(
      booking.stripe_checkout_session_id,
    );

    if (typeof session.payment_intent === "string") {
      paymentIntentId = session.payment_intent;
    }
  }

  if (paymentIntentId && !amountCents) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    amountCents = paymentIntent.amount_received || paymentIntent.amount;
  }

  if (!amountCents) {
    throw new Error("Missing amount_cents on booking");
  }

  const platformFeeCents =
    booking.platform_fee_cents ?? Math.round(amountCents * 0.15);

  const { data: updated, error } = await admin
    .from("bookings")
    .update({
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", booking.id)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Could not save payment data on booking");
  }

  return updated as BookingForPayout;
}

export async function releasePayout(rawBooking: BookingForPayout) {
  if (rawBooking.payout_released || rawBooking.stripe_transfer_id) {
    return {
      ok: true,
      released: true,
      message: "Booking is already completed and payout has already been released.",
      booking: rawBooking,
    };
  }

  const paymentReady =
    rawBooking.payment_status === "paid" ||
    rawBooking.payment_status === "released";

  if (!paymentReady) {
    throw new Error("Booking is not marked paid yet");
  }

  const booking = await fillMissingPaymentData(rawBooking);
  const admin = getAdmin();

  const { data: sitterProfile, error: sitterError } = await admin
    .from("profiles")
    .select(
      "id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled",
    )
    .eq("id", booking.sitter_id)
    .single();

  if (sitterError || !sitterProfile?.stripe_account_id) {
    throw new Error(
      sitterError?.message || "Sitter has not connected Stripe payouts",
    );
  }

  if (
    !sitterProfile.stripe_charges_enabled ||
    !sitterProfile.stripe_payouts_enabled
  ) {
    throw new Error("Sitter has not finished payout setup yet");
  }

  const amountCents = booking.amount_cents ?? 0;
  const platformFeeCents =
    booking.platform_fee_cents ?? Math.round(amountCents * 0.15);
  const sitterAmountCents = amountCents - platformFeeCents;

  if (sitterAmountCents <= 0) {
    throw new Error("Invalid payout amount");
  }

  const stripe = getStripe();

  const transfer = await stripe.transfers.create(
    {
      amount: sitterAmountCents,
      currency: "usd",
      destination: sitterProfile.stripe_account_id,
      transfer_group: `booking_${booking.id}`,
      metadata: {
        booking_id: booking.id,
        sitter_id: booking.sitter_id,
        owner_id: booking.owner_id,
      },
    },
    {
      idempotencyKey: `payout:${booking.id}`,
    },
  );

  const { data: completedBooking, error: completeError } = await admin
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      payout_released: true,
      payout_released_at: new Date().toISOString(),
      stripe_transfer_id: transfer.id,

      // Keep payment_status as paid.
      // Payout status is tracked by payout_released, payout_released_at, and stripe_transfer_id.
      payment_status: "paid",

      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", booking.id)
    .select("*")
    .single();

  if (completeError) {
    throw new Error(completeError.message);
  }

  return {
    ok: true,
    released: true,
    message: "Booking complete. Payout released to sitter.",
    transferId: transfer.id,
    booking: completedBooking,
  };
}

export const Route = createFileRoute("/api/bookings/complete")({
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

          const body = await request.json().catch(() => ({}));
          const bookingId = body.bookingId as string | undefined;

          if (!bookingId) {
            return new Response("Missing bookingId", { status: 400 });
          }

          const { data: booking, error: bookingError } = await admin
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          if (bookingError || !booking) {
            return new Response(bookingError?.message || "Booking not found", {
              status: 404,
            });
          }

          const typedBooking = booking as BookingForPayout;

          const isOwner = typedBooking.owner_id === userId;
          const isSitter = typedBooking.sitter_id === userId;

          if (!isOwner && !isSitter) {
            return new Response("Not allowed for this booking", { status: 403 });
          }

          const paymentReady =
            typedBooking.payment_status === "paid" ||
            typedBooking.payment_status === "released";

          if (!paymentReady) {
            return new Response("Booking is not marked paid yet", {
              status: 400,
            });
          }

          if (typedBooking.payout_released || typedBooking.stripe_transfer_id) {
            return Response.json({
              ok: true,
              released: true,
              message:
                "Booking is already completed and payout has already been released.",
              booking: typedBooking,
            });
          }

          const now = new Date().toISOString();

          const update: Record<string, unknown> = {
            updated_at: now,
          };

          if (isOwner) {
            update.client_completed_at = now;
          }

          if (isSitter) {
            update.sitter_completed_at = now;
          }

          const { data: updatedBooking, error: updateError } = await admin
            .from("bookings")
            .update(update as never)
            .eq("id", bookingId)
            .select("*")
            .single();

          if (updateError || !updatedBooking) {
            return new Response(
              updateError?.message || "Could not update booking",
              { status: 500 },
            );
          }

          const completedByBoth =
            Boolean(updatedBooking.client_completed_at) &&
            Boolean(updatedBooking.sitter_completed_at);

          if (!completedByBoth) {
            return Response.json({
              ok: true,
              released: false,
              message:
                "Completion saved. Payout releases after both client and sitter confirm.",
              booking: updatedBooking,
            });
          }

          const result = await releasePayout(updatedBooking as BookingForPayout);

          return Response.json(result);
        } catch (error) {
          return new Response(
            error instanceof Error ? error.message : "Unknown completion error",
            { status: 500 },
          );
        }
      },
    },
  },
});