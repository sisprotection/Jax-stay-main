import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Star,
  CreditCard,
  CheckCircle2,
  Loader2,
  Banknote,
  AlertCircle,
  ClipboardList,
  PawPrint,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api-client";
import { LiveTrackingPanel } from "@/components/bookings/LiveTrackingPanel";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — JaxStay" }] }),
  component: BookingsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
    cancel: typeof s.cancel === "string" ? s.cancel : undefined,
  }),
});

type Booking = {
  id: string;
  owner_id: string;
  sitter_id: string;
  service: string;
  service_category?: string | null;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  message: string | null;
  created_at: string;
  payment_status: string;
  payout_released: boolean;
  canceled_at?: string | null;
  canceled_by?: string | null;
  cancellation_reason?: string | null;
  amount_cents: number | null;
  platform_fee_cents: number | null;
  completed_at: string | null;
  client_completed_at: string | null;
  sitter_completed_at: string | null;

  trip_type?: string | null;
  distance_tier?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  pickup_datetime?: string | null;
  return_datetime?: string | null;
  extra_stops?: number | null;
  waiting_hours?: number | null;
  transport_notes?: string | null;
};

type IntakeSummary = {
  id: string;
  booking_id: string;
  pet_name: string | null;
  breed: string | null;
  age_years: number | null;
  weight_lbs: number | null;
  medications: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_care_authorized: boolean | null;
  feeding_schedule: string | null;
  walk_routine: string | null;
  trigger_notes: string | null;
  red_flags: string | null;
  prone_to_bolting: boolean | null;
  created_at: string;
  updated_at: string;
};

type ProfileMini = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type SitterPayoutInfo = {
  stripe_onboarding_complete: boolean;
  stripe_payouts_enabled: boolean;
} | null;

function formatDate(date?: string | null) {
  if (!date) return "Not set";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}/${day}/${year}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? "0");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatBookingWindow(booking: Pick<Booking, "start_date" | "end_date" | "start_time" | "end_time">) {
  const start = `${formatDate(booking.start_date)}${booking.start_time ? ` at ${formatTime(booking.start_time)}` : ""}`;
  const end = `${formatDate(booking.end_date)}${booking.end_time ? ` at ${formatTime(booking.end_time)}` : ""}`;
  return `${start} → ${end}`;
}

function formatMaybe(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function BookingsPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/bookings" });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [intakes, setIntakes] = useState<Record<string, IntakeSummary>>({});
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [payoutInfo, setPayoutInfo] = useState<SitterPayoutInfo>(null);
  const [trackingPremium, setTrackingPremium] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .or(`owner_id.eq.${user.id},sitter_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const list = (data as Booking[]) ?? [];
    setBookings(list);

    const ids = [...new Set(list.flatMap((b) => [b.owner_id, b.sitter_id]))];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      const profiles = (profs as ProfileMini[]) ?? [];
      setNames(
        Object.fromEntries(
          profiles.map((p) => [p.id, p.full_name || "JaxStay member"]),
        ),
      );
      setAvatars(Object.fromEntries(profiles.map((p) => [p.id, p.avatar_url])));
    } else {
      setNames({});
      setAvatars({});
    }

    const bookingIds = list.map((b) => b.id);
    if (bookingIds.length) {
      const { data: intakeRows, error: intakeError } = await supabase
        .from("pet_intake_forms")
        .select(
          "id, booking_id, pet_name, breed, age_years, weight_lbs, medications, vet_name, vet_phone, emergency_contact_name, emergency_contact_phone, emergency_care_authorized, feeding_schedule, walk_routine, trigger_notes, red_flags, prone_to_bolting, created_at, updated_at",
        )
        .in("booking_id", bookingIds);

      if (intakeError) {
        console.error(intakeError);
      }

      setIntakes(
        Object.fromEntries(
          ((intakeRows as IntakeSummary[]) ?? []).map((row) => [
            row.booking_id,
            row,
          ]),
        ),
      );
    } else {
      setIntakes({});
    }

    const { data: rs } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("author_id", user.id);
    setReviewed(
      new Set((rs ?? []).map((r) => r.booking_id).filter(Boolean) as string[]),
    );

    const { data: me } = await supabase.rpc("get_my_profile");
    if (me?.is_sitter) {
      setPayoutInfo({
        stripe_onboarding_complete: !!me.stripe_onboarding_complete,
        stripe_payouts_enabled: !!me.stripe_payouts_enabled,
      });
    } else {
      setPayoutInfo(null);
    }
    setTrackingPremium(
      !!(me as { tracking_premium?: boolean } | null)?.tracking_premium,
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (search.paid) toast.success("Payment received — booking confirmed!");
    if (search.cancel)
      toast.message("Payment cancelled. You can try again anytime.");
  }, [search.paid, search.cancel]);

  const updateStatus = async (
    id: string,
    status:
      | "accepted"
      | "awaiting_payment"
      | "declined"
      | "completed"
      | "canceled",
  ) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status } as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status.replace("_", " ")}`);
    load();
  };

  const payNow = async (id: string) => {
    setBusy(id);
    try {
      const { url } = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const markComplete = async (id: string) => {
    if (
      !confirm(
        "Confirm this booking is complete? Payout releases only after both client and sitter confirm completion.",
      )
    ) {
      return;
    }
    setBusy(id);
    try {
      const result = await apiFetch("/api/bookings/complete", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
      toast.success(
        result?.message ??
          "Completion confirmed. Payout releases after both sides confirm.",
      );
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const refund = async (id: string) => {
    if (
      !confirm(
        "Cancel and request refund? JaxStay may keep the 15% platform/payment-handling fee according to the refund policy.",
      )
    ) {
      return;
    }
    setBusy(id);
    try {
      await apiFetch("/api/bookings/refund", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
      toast.success("Refund issued");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };


  const cancelBeforePayment = async (booking: Booking) => {
    const isOwner = booking.owner_id === user?.id;
    const actionLabel = isOwner ? "cancel this request" : "cancel this booking";

    if (booking.payment_status === "paid") {
      toast.error("This booking has already been paid. Use Cancel & refund instead.");
      return;
    }

    const reason =
      prompt(`Reason to ${actionLabel}?`, isOwner ? "Client canceled before payment" : "Sitter canceled before payment") ||
      (isOwner ? "Client canceled before payment" : "Sitter canceled before payment");

    if (!confirm(`Are you sure you want to ${actionLabel}?`)) return;

    setBusy(booking.id);

    try {
      const nextStatus = isOwner ? "canceled" : "declined";

      const { error } = await supabase
        .from("bookings")
        .update({
          status: nextStatus,
          canceled_at: new Date().toISOString(),
          canceled_by: user?.id,
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", booking.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(isOwner ? "Booking request canceled" : "Booking declined/canceled");
      load();
    } finally {
      setBusy(null);
    }
  };

  const connectStripe = async () => {
    setBusy("connect");
    try {
      const { url } = await apiFetch("/api/stripe/connect-onboard", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-700">Bookings</h1>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
        </div>

        {payoutInfo && !payoutInfo.stripe_payouts_enabled && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <AlertCircle className="h-5 w-5 text-accent-foreground" />
            <div className="flex-1">
              <p className="font-600">Connect Stripe to receive payouts</p>
              <p className="text-sm text-muted-foreground">
                Clients can only pay you after you finish Stripe onboarding
                (takes ~2 minutes).
              </p>
            </div>
            <button
              onClick={connectStripe}
              disabled={busy === "connect"}
              className="rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground"
            >
              {busy === "connect"
                ? "Opening…"
                : payoutInfo.stripe_onboarding_complete
                  ? "Continue setup"
                  : "Connect Stripe"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            No bookings yet.{" "}
            <Link to="/sitters" className="text-primary underline">
              Find a sitter
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {bookings.map((b) => {
              const isOwner = b.owner_id === user?.id;
              const counterpartyId = isOwner ? b.sitter_id : b.owner_id;
              const counterparty = names[counterpartyId] ?? "JaxStay member";
              const amount = b.amount_cents
                ? `$${(b.amount_cents / 100).toFixed(2)}`
                : null;
              const intake = intakes[b.id];
              const ownerAvatar = avatars[b.owner_id] ?? null;
              const sitterAvatar = avatars[b.sitter_id] ?? null;

              return (
                <li
                  key={b.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={isOwner ? sitterAvatar : ownerAvatar}
                          name={counterparty}
                        />
                        <div>
                          <p className="font-600">
                            {b.service} — {counterparty}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatBookingWindow(b)}
                            {amount ? ` · ${amount}` : ""}
                          </p>
                        </div>
                      </div>

                      {b.message && <p className="mt-3 text-sm">{b.message}</p>}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={b.status} />
                      <PayoutBadge booking={b} />
                    </div>
                  </div>

                  {!isOwner && b.status === "pending" && (
                    <RequestReviewCard
                      booking={b}
                      ownerName={names[b.owner_id] ?? "Client"}
                      ownerAvatar={ownerAvatar}
                      intake={intake}
                    />
                  )}

                  <BookingDetails booking={b} />

                  <BookingSafetyNotice booking={b} isOwner={isOwner} />

                  {b.cancellation_reason && (
                    <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      <span className="font-700">Canceled/declined reason:</span>{" "}
                      {b.cancellation_reason}
                    </div>
                  )}

                  <IntakePanel booking={b} isOwner={isOwner} intake={intake} />

                  <CompletionPanel booking={b} isOwner={isOwner} />

                  {/* Owner: payment prompt after sitter accepts */}
                  {isOwner && b.status === "awaiting_payment" && (
                    <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-600">
                        Your sitter accepted the booking. Complete payment to
                        confirm.
                      </p>
                      <button
                        onClick={() => payNow(b.id)}
                        disabled={busy === b.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground"
                      >
                        {busy === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        Pay & confirm booking
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelBeforePayment(b)}
                        disabled={busy === b.id}
                        className="ml-2 mt-3 inline-flex items-center gap-2 rounded-full border border-destructive px-4 py-2 text-sm font-600 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        Cancel request
                      </button>
                    </div>
                  )}

                  {/* Live tracking — active (paid, not yet completed) bookings only */}
                  {b.payment_status === "paid" &&
                    !b.payout_released &&
                    b.status !== "canceled" && (
                      <LiveTrackingPanel
                        bookingId={b.id}
                        ownerId={b.owner_id}
                        sitterId={b.sitter_id}
                        currentUserId={user!.id}
                        ownerHasPremium={isOwner ? trackingPremium : true}
                      />
                    )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/messages"
                      search={{ peer: isOwner ? b.sitter_id : b.owner_id }}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      Message
                    </Link>

                    {isOwner &&
                      b.payment_status !== "paid" &&
                      ["pending", "accepted", "awaiting_payment"].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => cancelBeforePayment(b)}
                          disabled={busy === b.id}
                          className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                        >
                          Cancel request
                        </button>
                      )}

                    {!isOwner &&
                      b.payment_status !== "paid" &&
                      ["accepted", "awaiting_payment"].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => cancelBeforePayment(b)}
                          disabled={busy === b.id}
                          className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                        >
                          Cancel before payment
                        </button>
                      )}

                    {!isOwner && b.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(b.id, "awaiting_payment")}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => cancelBeforePayment(b)}
                          disabled={busy === b.id}
                          className="rounded-full border border-border px-3 py-1 text-xs"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {isOwner &&
                      b.status === "confirmed" &&
                      b.payment_status === "paid" &&
                      !b.payout_released && (
                        <button
                          onClick={() => markComplete(b.id)}
                          disabled={busy === b.id || !!b.client_completed_at}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground disabled:opacity-60"
                        >
                          {busy === b.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {b.client_completed_at
                            ? "Pet return confirmed"
                            : "Confirm pet returned"}
                        </button>
                      )}

                    {!isOwner &&
                      b.status === "confirmed" &&
                      b.payment_status === "paid" &&
                      !b.payout_released && (
                        <button
                          onClick={() => markComplete(b.id)}
                          disabled={busy === b.id || !!b.sitter_completed_at}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground disabled:opacity-60"
                        >
                          {busy === b.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {b.sitter_completed_at
                            ? "Service marked complete"
                            : "Mark service complete"}
                        </button>
                      )}

                    {isOwner &&
                      b.payment_status === "paid" &&
                      !b.payout_released &&
                      !b.client_completed_at && (
                        <button
                          onClick={() => refund(b.id)}
                          disabled={busy === b.id}
                          className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"
                        >
                          Cancel & refund
                        </button>
                      )}


                    {isOwner &&
                      (b.status === "completed" || b.payout_released) &&
                      !reviewed.has(b.id) && (
                        <ReviewForm
                          bookingId={b.id}
                          sitterId={b.sitter_id}
                          authorId={user!.id}
                          onDone={load}
                        />
                      )}

                    {isOwner && reviewed.has(b.id) && (
                      <span className="text-xs text-muted-foreground">
                        ✓ Review submitted
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-700">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}


function BookingSafetyNotice({
  booking,
  isOwner,
}: {
  booking: Booking;
  isOwner: boolean;
}) {
  const isPaid = booking.payment_status === "paid";
  const isCanceled = booking.status === "canceled" || booking.status === "cancelled" || booking.status === "declined";

  if (isCanceled) {
    return (
      <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
        This booking is no longer active. If money was paid, refund handling follows JaxStay's cancellation and refund policy.
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-foreground/80">
        <p className="font-700">Before payment</p>
        <p className="mt-1">
          {isOwner
            ? "You can cancel this request before paying if you do not want to move forward with this sitter."
            : "You can accept, decline, or cancel before payment if the request is not a safe fit for your schedule or the pet's needs."}
        </p>
      </div>
    );
  }

  if (isPaid && !booking.payout_released) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-foreground/80">
        <p className="font-700">Payment protection</p>
        <p className="mt-1">
          {isOwner
            ? "Your payment is held by JaxStay until the booking is completed. After your pet is returned and both sides confirm completion, payout is released to the sitter."
            : "The client has paid. Funds are held by JaxStay until the client confirms the pet was returned and you mark the service complete. Stripe payout timing depends on your connected Stripe account."}
        </p>
      </div>
    );
  }

  if (booking.payout_released) {
    return (
      <div className="mt-4 rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-sm text-foreground/80">
        <p className="font-700">Booking completed</p>
        <p className="mt-1">
          This booking is complete and payout has been released. Stripe may still take time to move funds into the sitter's bank account.
        </p>
      </div>
    );
  }

  return null;
}

function BookingDetails({ booking }: { booking: Booking }) {
  const isTransport = booking.service_category === "transport";

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm font-700">
        <CalendarIcon /> Booking details
      </div>

      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>
          Dates:{" "}
          <span className="text-foreground">
            {formatBookingWindow(booking)}
          </span>
        </p>
        <p>
          Service: <span className="text-foreground">{booking.service}</span>
        </p>

        {isTransport && (
          <>
            <p>
              Pickup time:{" "}
              <span className="text-foreground">
                {formatDateTime(booking.pickup_datetime)}
              </span>
            </p>
            <p>
              Return time:{" "}
              <span className="text-foreground">
                {formatDateTime(booking.return_datetime)}
              </span>
            </p>
            <p>
              Trip:{" "}
              <span className="text-foreground">
                {formatMaybe(booking.trip_type)?.replaceAll("_", " ")}
              </span>
            </p>
            <p>
              Distance:{" "}
              <span className="text-foreground">
                {formatMaybe(booking.distance_tier)
                  ?.replaceAll("tier_", "")
                  .replaceAll("_", "–")}
              </span>
            </p>
            <p className="sm:col-span-2">
              Pickup:{" "}
              <span className="text-foreground">
                {formatMaybe(booking.pickup_address)}
              </span>
            </p>
            <p className="sm:col-span-2">
              Drop-off:{" "}
              <span className="text-foreground">
                {formatMaybe(booking.dropoff_address)}
              </span>
            </p>
            <p>
              Extra stops:{" "}
              <span className="text-foreground">
                {booking.extra_stops ?? 0}
              </span>
            </p>
            <p>
              Waiting hours:{" "}
              <span className="text-foreground">
                {booking.waiting_hours ?? 0}
              </span>
            </p>
          </>
        )}
      </div>

      {booking.transport_notes && (
        <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
          <span className="font-700">Transport notes:</span>{" "}
          {booking.transport_notes}
        </p>
      )}
    </div>
  );
}

function CalendarIcon() {
  return <Clock className="h-4 w-4 text-primary" />;
}

function RequestReviewCard({
  booking,
  ownerName,
  ownerAvatar,
  intake,
}: {
  booking: Booking;
  ownerName: string;
  ownerAvatar?: string | null;
  intake?: IntakeSummary;
}) {
  const isTransport = booking.service_category === "transport";

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar src={ownerAvatar} name={ownerName} />
          <div className="min-w-0 flex-1">
            <p className="font-700">Review before accepting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ownerName} sent a booking request. Check the service, dates, time,
              notes, transport details, and pet intake status before accepting.
            </p>
          </div>
        </div>

        <Link
          to="/messages"
          search={{ peer: booking.owner_id } as never}
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-700 hover:bg-muted"
        >
          Message client
        </Link>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-background p-3">
          <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Service
          </p>
          <p className="mt-1 font-700">{booking.service}</p>
        </div>

        <div className="rounded-xl bg-background p-3">
          <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Date & time
          </p>
          <p className="mt-1 font-700">{formatBookingWindow(booking)}</p>
        </div>

        {booking.message && (
          <div className="rounded-xl bg-background p-3 sm:col-span-2">
            <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
              Client note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-foreground">
              {booking.message}
            </p>
          </div>
        )}

        {isTransport && (
          <>
            <div className="rounded-xl bg-background p-3 sm:col-span-2">
              <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                Transportation
              </p>
              <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2">
                <p>
                  Pickup: <span className="text-foreground">{formatMaybe(booking.pickup_address)}</span>
                </p>
                <p>
                  Drop-off: <span className="text-foreground">{formatMaybe(booking.dropoff_address)}</span>
                </p>
                <p>
                  Pickup time: <span className="text-foreground">{formatDateTime(booking.pickup_datetime)}</span>
                </p>
                <p>
                  Return time: <span className="text-foreground">{formatDateTime(booking.return_datetime)}</span>
                </p>
                <p>
                  Extra stops: <span className="text-foreground">{booking.extra_stops ?? 0}</span>
                </p>
                <p>
                  Waiting hours: <span className="text-foreground">{booking.waiting_hours ?? 0}</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className={`mt-4 rounded-2xl border p-4 ${
          intake
            ? "border-green-500/30 bg-green-500/10"
            : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        <div className="flex items-start gap-2">
          {intake ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-700" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
          )}
          <div>
            <p className={`text-sm font-700 ${intake ? "text-green-800" : "text-amber-800"}`}>
              {intake ? "Pet intake submitted" : "Pet intake not submitted yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {intake
                ? "Review these details before accepting if you need anything clarified."
                : "You can message the owner and ask them to fill the intake before you accept."}
            </p>
          </div>
        </div>

        {intake && (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              Pet: <span className="font-700 text-foreground">{intake.pet_name || "—"}</span>
            </p>
            <p>
              Breed: <span className="text-foreground">{formatMaybe(intake.breed)}</span>
            </p>
            <p>
              Weight: <span className="text-foreground">{intake.weight_lbs ? `${intake.weight_lbs} lbs` : "—"}</span>
            </p>
            <p>
              Emergency care: <span className="text-foreground">{intake.emergency_care_authorized ? "Authorized" : "Not authorized yet"}</span>
            </p>
            {intake.medications && (
              <p className="sm:col-span-2">
                Medications: <span className="text-foreground">{intake.medications}</span>
              </p>
            )}
            {intake.red_flags && (
              <p className="sm:col-span-2">
                Red flags: <span className="text-foreground">{intake.red_flags}</span>
              </p>
            )}
            {intake.prone_to_bolting && (
              <p className="sm:col-span-2 rounded-xl bg-red-500/10 p-2 text-red-700">
                Safety note: this pet may bolt or try to escape.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IntakePanel({
  booking,
  isOwner,
  intake,
}: {
  booking: Booking;
  isOwner: boolean;
  intake?: IntakeSummary;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-700">Pet intake</p>
            <p className="text-xs text-muted-foreground">
              {intake
                ? `Submitted ${formatDateTime(intake.updated_at)}`
                : isOwner
                  ? "Complete this so your sitter can safely care for your pet."
                  : "Waiting for the owner to submit pet care details."}
            </p>
          </div>
        </div>

        {isOwner &&
          (booking.status === "pending" ||
            booking.status === "accepted" ||
            booking.status === "awaiting_payment" ||
            booking.status === "confirmed") && (
            <button
              type="button"
              onClick={() => {
                window.location.assign(`/intake?bookingId=${booking.id}`);
              }}
              className="rounded-full bg-accent px-3 py-1 text-xs font-600"
            >
              {intake ? "Update intake" : "Fill intake"}
            </button>
          )}
      </div>

      {intake ? (
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            Pet:{" "}
            <span className="font-700 text-foreground">
              {intake.pet_name || "—"}
            </span>
          </p>
          <p>
            Breed:{" "}
            <span className="text-foreground">{formatMaybe(intake.breed)}</span>
          </p>
          <p>
            Age:{" "}
            <span className="text-foreground">
              {formatMaybe(intake.age_years)}
            </span>
          </p>
          <p>
            Weight:{" "}
            <span className="text-foreground">
              {intake.weight_lbs ? `${intake.weight_lbs} lbs` : "—"}
            </span>
          </p>
          <p>
            Vet:{" "}
            <span className="text-foreground">
              {formatMaybe(intake.vet_name)}
            </span>
          </p>
          <p>
            Vet phone:{" "}
            <span className="text-foreground">
              {formatMaybe(intake.vet_phone)}
            </span>
          </p>
          <p>
            Emergency authorized:{" "}
            <span className="text-foreground">
              {intake.emergency_care_authorized ? "Yes" : "No"}
            </span>
          </p>
          <p>
            Bolting risk:{" "}
            <span className="text-foreground">
              {intake.prone_to_bolting ? "Yes" : "No"}
            </span>
          </p>
          {intake.medications && (
            <p className="sm:col-span-2">
              Medications:{" "}
              <span className="text-foreground">{intake.medications}</span>
            </p>
          )}
          {intake.feeding_schedule && (
            <p className="sm:col-span-2">
              Feeding:{" "}
              <span className="text-foreground">{intake.feeding_schedule}</span>
            </p>
          )}
          {intake.walk_routine && (
            <p className="sm:col-span-2">
              Walk routine:{" "}
              <span className="text-foreground">{intake.walk_routine}</span>
            </p>
          )}
          {intake.trigger_notes && (
            <p className="sm:col-span-2">
              Triggers:{" "}
              <span className="text-foreground">{intake.trigger_notes}</span>
            </p>
          )}
          {intake.red_flags && (
            <p className="sm:col-span-2">
              Red flags:{" "}
              <span className="text-foreground">{intake.red_flags}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No pet intake submitted for this booking yet.
        </p>
      )}
    </div>
  );
}

function CompletionPanel({
  booking,
  isOwner,
}: {
  booking: Booking;
  isOwner: boolean;
}) {
  if (booking.payment_status !== "paid" && !booking.payout_released)
    return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm font-700">
        <ShieldCheck className="h-4 w-4 text-primary" /> Completion checklist
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <CompletionItem
          label="Client confirmed pet returned"
          done={!!booking.client_completed_at}
          date={booking.client_completed_at}
        />
        <CompletionItem
          label="Sitter marked service complete"
          done={!!booking.sitter_completed_at}
          date={booking.sitter_completed_at}
        />
        <CompletionItem
          label="Payout released"
          done={!!booking.payout_released}
          date={booking.completed_at}
        />
      </div>
      {isOwner && !booking.client_completed_at && !booking.payout_released && (
        <p className="mt-3 text-xs text-muted-foreground">
          Confirm pet returned only when your pet is back and the service is
          complete.
        </p>
      )}
      {!isOwner && !booking.sitter_completed_at && !booking.payout_released && (
        <p className="mt-3 text-xs text-muted-foreground">
          Mark service complete only after the booking is finished.
        </p>
      )}
    </div>
  );
}

function CompletionItem({
  label,
  done,
  date,
}: {
  label: string;
  done: boolean;
  date?: string | null;
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-xs ${
        done
          ? "border-green-500/30 bg-green-500/10 text-green-700"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      <div className="flex items-center gap-2 font-700">
        {done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <PawPrint className="h-4 w-4" />
        )}
        {label}
      </div>
      {date && <p className="mt-1 opacity-80">{formatDateTime(date)}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-accent/20",
    awaiting_payment: "bg-primary/15 text-primary",
    accepted: "bg-primary/15 text-primary",
    confirmed: "bg-primary/20 text-primary",
    completed: "bg-secondary",
    declined: "bg-muted text-muted-foreground",
    canceled: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-600 ${map[status] ?? "bg-muted"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function PayoutBadge({ booking }: { booking: Booking }) {
  let label = "";
  let cls = "bg-muted text-muted-foreground";

  if (booking.status === "awaiting_payment") {
    label = "Awaiting payment";
    cls = "bg-accent/15 text-accent-foreground";
  } else if (booking.payment_status === "paid" && !booking.payout_released) {
    label = "Confirmed";
    cls = "bg-primary/15 text-primary";
  } else if (booking.payout_released) {
    label = "Paid out";
    cls = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  } else if (booking.payment_status === "refunded") {
    label = "Refunded";
    cls = "bg-destructive/15 text-destructive";
  } else return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-600 ${cls}`}
    >
      <Banknote className="h-3 w-3" /> {label}
    </span>
  );
}

function ReviewForm({
  bookingId,
  sitterId,
  authorId,
  onDone,
}: {
  bookingId: string;
  sitterId: string;
  authorId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const submit = async () => {
    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      sitter_id: sitterId,
      author_id: authorId,
      rating,
      body,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Review posted");
    setOpen(false);
    onDone();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-3 py-1 text-xs"
      >
        Leave review
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-background p-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star
              className={`h-5 w-5 ${
                n <= rating
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="How was your experience?"
        className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={submit}
          className="rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground"
        >
          Submit
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
