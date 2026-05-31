import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star,
  Shield,
  MapPin,
  Award,
  Loader2,
  BadgeCheck,
  Dog,
  Cat,
  Car,
  Weight,
  Navigation,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TransportBookingForm } from "@/components/sitters/TransportBookingForm";
import { AvailabilityCalendar } from "@/components/sitters/AvailabilityCalendar";
import type { TierPrices } from "@/lib/transport-pricing";

export const Route = createFileRoute("/sitters/$sitterId")({
  head: () => ({ meta: [{ title: "Sitter Profile — JaxStay" }] }),
  component: SitterDetail,
});

type Profile = {
  id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  avatar_url: string | null;
  sitter_headline: string | null;
  sitter_rate: number | null;
  sitter_years_experience: number | null;
  sitter_gallery: string[];
  is_sitter: boolean;
  sitter_test_passed_at: string | null;
  verification_status?: string;

  accepts_dogs?: boolean;
  accepts_cats?: boolean;
  max_pet_weight_lbs?: number | null;

  tracking_premium?: boolean;

  sitter_transport_enabled?: boolean;
  sitter_transport_has_vehicle?: boolean;
  sitter_transport_multi_pet?: boolean;
  sitter_transport_has_crate?: boolean;
  sitter_transport_prices_by_tier?: TierPrices;
  sitter_extra_stop_fee_cents?: number | null;
  sitter_waiting_fee_per_hour_cents?: number | null;
};

type Review = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  author_id: string;
  hidden: boolean;
  author_name?: string;
};

function moneyFromCents(cents?: number | null) {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function dollarFromUnknown(value: unknown) {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return `$${value.toFixed(2)}`;
  }

  const num = Number(value);
  if (Number.isFinite(num)) {
    return `$${num.toFixed(2)}`;
  }

  return null;
}

function yesNo(value?: boolean) {
  return value ? "Yes" : "No";
}

function SitterDetail() {
  const { sitterId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: p, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        city,
        state,
        bio,
        avatar_url,
        is_sitter,
        sitter_headline,
        sitter_rate,
        sitter_services,
        sitter_years_experience,
        sitter_gallery,
        sitter_test_passed_at,
        verification_status,
        accepts_dogs,
        accepts_cats,
        max_pet_weight_lbs,
        inactive,
        hide_past_pets,
        created_at,
        updated_at,
        tracking_premium,
        sitter_transport_enabled,
        sitter_transport_has_vehicle,
        sitter_transport_multi_pet,
        sitter_transport_has_crate,
        sitter_transport_prices_by_tier,
        sitter_extra_stop_fee_cents,
        sitter_waiting_fee_per_hour_cents
      `,
      )
      .eq("id", sitterId)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
      toast.error(profileError.message);
    }

    setProfile(p as Profile | null);

    const { data: rs, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("sitter_id", sitterId)
      .eq("hidden", false)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error(reviewsError);
    }

    const list = (rs as Review[]) ?? [];

    if (list.length) {
      const authorIds = [...new Set(list.map((r) => r.author_id))];

      const { data: authors } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", authorIds);

      const map = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name]));

      list.forEach((r) => {
        r.author_name = map[r.author_id] ?? "JaxStay member";
      });
    }

    setReviews(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [sitterId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!profile || !profile.is_sitter) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl font-700">Sitter not found</h1>
          <Link to="/sitters" className="mt-4 inline-block text-primary underline">
            Browse sitters
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const backgroundCheckApproved = profile.verification_status === "approved";
  const tierPrices = (profile.sitter_transport_prices_by_tier ?? {}) as Record<string, unknown>;

  const submitBooking = async (form: FormData) => {
    if (!user) {
      nav({ to: "/login", search: { mode: "signup", redirect: `/sitters/${sitterId}` } as never });
      return;
    }

    if (user.id === profile.id) {
      return toast.error("You can't book yourself");
    }

    const start = form.get("start") as string;
    const end = form.get("end") as string;
    const startTime = form.get("start_time") as string;
    const endTime = form.get("end_time") as string;
    const service = form.get("service") as string;
    const message = form.get("message") as string;

    if (!start || !end || !startTime || !endTime) {
      return toast.error("Please choose both dates and times.");
    }

    const { error } = await supabase.from("bookings").insert({
      owner_id: user.id,
      sitter_id: profile.id,
      service,
      start_date: start,
      end_date: end,
      start_time: startTime,
      end_time: endTime,
      message,
      status: "pending",
    } as never);

    if (error) return toast.error(error.message);

    toast.success("Request sent!");
    nav({ to: "/dashboard" });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <Link to="/sitters" className="text-sm text-muted-foreground hover:text-foreground">
          ← All sitters
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl shadow-warm bg-muted aspect-square w-full max-w-[360px] mx-auto">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl font-700 text-muted-foreground">
                {profile.full_name?.[0] ?? "J"}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-600 text-foreground">
                <Shield className="h-3 w-3" /> Qualified sitter
              </span>

              {backgroundCheckApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-700 text-amber-700 dark:text-amber-300">
                  <BadgeCheck className="h-3 w-3" /> Background check completed
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-4xl font-700">{profile.full_name}</h1>

            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {profile.city}
              {profile.state ? `, ${profile.state}` : ""}
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-600">{reviews.length ? avg.toFixed(1) : "New sitter"}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
              {profile.sitter_years_experience ? (
                <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                  <Award className="h-3 w-3" />
                  {profile.sitter_years_experience}y experience
                </span>
              ) : null}
            </div>

            {profile.sitter_rate != null && (
              <p className="mt-4 text-2xl font-700">
                ${profile.sitter_rate}
                <span className="text-base text-muted-foreground"> / night</span>
              </p>
            )}

            <p className="mt-4 text-foreground/80">
              {profile.bio ?? profile.sitter_headline ?? "Trusted JaxStay sitter."}
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-lg font-700">Sitter preferences</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                These are the options this sitter selected in their JaxStay settings.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm font-700">
                    <Dog className="h-4 w-4 text-primary" />
                    Dogs accepted
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {yesNo(profile.accepts_dogs)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm font-700">
                    <Cat className="h-4 w-4 text-primary" />
                    Cats accepted
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {yesNo(profile.accepts_cats)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm font-700">
                    <Weight className="h-4 w-4 text-primary" />
                    Max pet weight
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.max_pet_weight_lbs ? `${profile.max_pet_weight_lbs} lbs` : "No limit listed"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm font-700">
                    <Navigation className="h-4 w-4 text-primary" />
                    Live pet tracking
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.tracking_premium
                      ? "Available by sitter approval per booking"
                      : "Not offered"}
                  </p>
                </div>
              </div>
            </div>

            {profile.sitter_transport_enabled && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h3 className="flex items-center gap-2 font-display text-lg font-700">
                  <Car className="h-5 w-5 text-primary" />
                  Pet transportation
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  This sitter offers pet transportation for vet visits, grooming, or other pet trips.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Pet-safe vehicle</p>
                    <p className="font-700">{yesNo(profile.sitter_transport_has_vehicle)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Multiple pets</p>
                    <p className="font-700">{yesNo(profile.sitter_transport_multi_pet)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Crate / harness</p>
                    <p className="font-700">{yesNo(profile.sitter_transport_has_crate)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-background p-3">
                  <p className="text-sm font-700">Transportation pricing</p>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>0–5 miles: {dollarFromUnknown(tierPrices["0-5"]) ?? "Not listed"}</p>
                    <p>6–15 miles: {dollarFromUnknown(tierPrices["6-15"]) ?? "Not listed"}</p>
                    <p>16–30 miles: {dollarFromUnknown(tierPrices["16-30"]) ?? "Not listed"}</p>
                    <p>31–50 miles: {dollarFromUnknown(tierPrices["31-50"]) ?? "Not listed"}</p>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    50+ miles requires a custom quote.
                  </p>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      Extra stop fee:{" "}
                      {moneyFromCents(profile.sitter_extra_stop_fee_cents) ?? "Not listed"}
                    </p>
                    <p>
                      Waiting fee/hour:{" "}
                      {moneyFromCents(profile.sitter_waiting_fee_per_hour_cents) ?? "Not listed"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <TransportBookingForm
                    sitterId={profile.id}
                    sitterName={profile.full_name}
                    prices={(profile.sitter_transport_prices_by_tier ?? {}) as TierPrices}
                    extraStopFeeCents={profile.sitter_extra_stop_fee_cents ?? null}
                    waitingFeePerHourCents={profile.sitter_waiting_fee_per_hour_cents ?? null}
                  />
                </div>
              </div>
            )}

            <BeforeYouBookCard />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitBooking(new FormData(e.currentTarget));
              }}
              className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <h3 className="font-display text-lg font-600">Request a booking</h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-500">
                  Service
                  <select
                    name="service"
                    required
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option>Boarding</option>
                    <option>Daycare</option>
                    <option>Walks</option>
                    <option>Drop-in visits</option>
                    <option>House sitting</option>
                  </select>
                </label>

                <label className="text-xs font-500">
                  Start date
                  <input
                    type="date"
                    name="start"
                    required
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-500">
                  Start time
                  <input
                    type="time"
                    name="start_time"
                    required
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-500">
                  End date
                  <input
                    type="date"
                    name="end"
                    required
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-500">
                  End time
                  <input
                    type="time"
                    name="end_time"
                    required
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="mt-3 block text-xs font-500">
                Message
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Tell the sitter about your dog…"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground shadow-soft transition hover:scale-[1.01]"
              >
                {user ? "Send booking request — free" : "Sign up to book this sitter"}
              </button>

              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                No charge to request. Payment is requested after the sitter accepts.
              </p>
            </form>
          </div>
        </div>

        {profile.sitter_gallery?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-700">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {profile.sitter_gallery.map((u) => (
                <img key={u} src={u} alt="" className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-display text-2xl font-700">Trust & safety</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-700">Sitter test</p>
              <p className="text-sm text-muted-foreground">
                {profile.sitter_test_passed_at ? "Passed JaxStay sitter test" : "Not completed"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-700">Verification</p>
              <p className="text-sm text-muted-foreground">
                {backgroundCheckApproved
                  ? "Background check completed"
                  : "Background check not completed yet"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <Camera className="h-5 w-5 text-primary" />
              <p className="mt-2 font-700">Photo updates</p>
              <p className="text-sm text-muted-foreground">
                Daily updates are encouraged during bookings.
              </p>
            </div>
          </div>
        </div>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">What these badges mean:</strong> Qualified means this sitter passed JaxStay’s sitter safety test. Background check completed means a sitter uploaded a background-check document and a JaxStay admin or moderator reviewed and approved it.
          </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-700">Availability</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Green = available · grey = blocked off · orange = already booked.
          </p>
          <div className="mt-4 max-w-md">
            <AvailabilityCalendar sitterId={profile.id} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-700">Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <p className="mt-3 text-muted-foreground">
              No reviews yet — be the first after your first booking.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-600">{r.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {r.body && <p className="mt-2 text-sm text-foreground/80">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
function BeforeYouBookCard() {
  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
      <p className="font-display text-lg font-700">Before you book</p>

      <div className="mt-3 space-y-2 text-sm text-foreground/75">
        <p>
          Message the sitter first if you have questions about your pet's routine, behavior, medical needs, transportation, or home rules.
        </p>
        <p>
          Review the sitter's badges, availability, services, transportation options, and pricing before sending a request.
        </p>
        <p>
          After the sitter accepts, pay through JaxStay to confirm. Your payment is held until the booking is completed.
        </p>
        <p>
          After booking, complete the pet intake form so the sitter can review feeding, medical, emergency, behavior, and safety details.
        </p>
      </div>
    </div>
  );
}
