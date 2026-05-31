// Owner cancels a paid booking before completion.
// JaxStay keeps the 15% platform/payment-handling fee; owner receives sitter portion only.
import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getAdmin, computeFee } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/bookings/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if ("error" in auth) return auth.error;

        const { supabase, userId } = auth;

        const { bookingId, reason } = (await request.json().catch(() => ({}))) as {
          bookingId?: string;
          reason?: string;
        };

        if (!bookingId) {
          return new Response("bookingId required", { status: 400 });
        }

        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();

        if (!booking) {
          return new Response("Booking not found", { status: 404 });
        }

        if (booking.owner_id !== userId) {
          return new Response("Only the owner can request this cancellation/refund", { status: 403 });
        }

        if (booking.payment_status !== "paid") {
          return new Response("Booking is not refundable because payment has not been completed", { status: 400 });
        }

        if (booking.payout_released) {
          return new Response("Payout already released — contact support", { status: 400 });
        }

        if (!booking.stripe_payment_intent_id) {
          return new Response("Missing payment intent", { status: 400 });
        }

        if (!booking.amount_cents) {
          return new Response("Missing booking amount", { status: 400 });
        }

        const admin = getAdmin();

        const platformFee =
          booking.platform_fee_cents ?? computeFee(booking.amount_cents).fee;

        const refundAmount = Math.max(booking.amount_cents - platformFee, 0);

        if (refundAmount <= 0) {
          return new Response("Refund amount is zero after platform fee", { status: 400 });
        }

        const stripe = getStripe();

        const refund = await stripe.refunds.create(
          {
            payment_intent: booking.stripe_payment_intent_id,
            amount: refundAmount,
            metadata: {
              booking_id: booking.id,
              cancellation_type: "owner_cancelled_before_service",
              platform_fee_retained_cents: String(platformFee),
            },
          },
          { idempotencyKey: `refund:owner-cancel:${booking.id}` },
        );

        await admin
          .from("bookings")
          .update({
            payment_status: "partially_refunded",
            status: "cancelled",
            stripe_refund_id: refund.id,
            refund_status: "processed",
            refund_amount_cents: refundAmount,
            platform_fee_nonrefundable: true,
            canceled_at: new Date().toISOString(),
            canceled_by: userId,
            cancellation_type: "owner_cancelled_before_service",
            cancellation_reason: reason ?? "Owner cancelled before service began",
          } as never)
          .eq("id", booking.id);

        return Response.json({
          ok: true,
          refundId: refund.id,
          refundAmountCents: refundAmount,
          platformFeeRetainedCents: platformFee,
        });
      },
    },
  },
});
