import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Star,
  SlidersHorizontal,
  BadgeCheck,
  ShieldCheck,
  Clock,
  MessageSquare,
  Calendar as CalIcon,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  SearchWizard,
  DEFAULT_CRITERIA,
  type SearchCriteria,
} from "@/components/sitters/SearchWizard";
import { SitterMap, type Pin } from "@/components/sitters/SitterMap";
import { coordsFor, distanceMiles, DOG_SIZES, SERVICE_TYPES } from "@/data/city-coords";

export const Route = createFileRoute("/sitters")({
  head: () => ({
    meta: [
      { title: "Find a Dog Sitter — JaxStay" },
      {
        name: "description",
        content:
          "Browse vetted, qualified pet sitters near you. Boarding, walking, drop-ins, day care, and training.",
      },
    ],
  }),
  component: SittersPage,
});

type SitterRow = {
  id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  avatar_url: string | null;
  sitter_headline: string | null;
  sitter_rate: number | null;
  sitter_years_experience: number | null;
  sitter_services: string[] | null;
  accepts_dogs: boolean | null;
  accepts_cats: boolean | null;
  max_pet_weight_lbs: number | null;
  verification_status: string | null;
  latitude: number | null;
  longitude: number | null;
  avg_rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  distance?: number;
};

const SEARCH_STORAGE_KEY = "jaxstay_sitter_search_criteria";

function loadSavedCriteria(): SearchCriteria | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(SEARCH_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SearchCriteria) : null;
  } catch {
    return null;
  }
}

function saveCriteria(criteria: SearchCriteria) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(criteria));
}

function SittersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedCriteria = useMemo(() => loadSavedCriteria(), []);
  const [sitters, setSitters] = useState<SitterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(!savedCriteria);
  const [criteria, setCriteria] = useState<SearchCriteria | null>(savedCriteria);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState(savedCriteria?.location?.label ?? "");
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select(
          "id, full_name, city, state, bio, avatar_url, sitter_headline, sitter_rate, sitter_years_experience, sitter_services, accepts_dogs, accepts_cats, max_pet_weight_lbs, verification_status, latitude, longitude",
        )
        .eq("is_sitter", true)
        .eq("inactive", false)
        .not("sitter_test_passed_at", "is", null);
      const list = (profs as SitterRow[]) ?? [];
      if (list.length) {
        const ids = list.map((s) => s.id);
        const { data: reviews } = await supabase
          .from("reviews")
          .select("sitter_id, rating")
          .in("sitter_id", ids)
          .eq("hidden", false);
        const agg: Record<string, { sum: number; n: number }> = {};
        (reviews ?? []).forEach((r: { sitter_id: string; rating: number }) => {
          agg[r.sitter_id] = agg[r.sitter_id] ?? { sum: 0, n: 0 };
          agg[r.sitter_id].sum += r.rating;
          agg[r.sitter_id].n += 1;
        });
        list.forEach((s) => {
          const a = agg[s.id];
          s.avg_rating = a ? a.sum / a.n : 0;
          s.review_count = a?.n ?? 0;
          // Prefer geocoded lat/lng saved on the profile; fall back to the city centroid lookup.
          if (s.latitude != null && s.longitude != null) {
            s.lat = s.latitude;
            s.lng = s.longitude;
          } else {
            const co = coordsFor(s.city, s.state);
            if (co) {
              s.lat = co.lat;
              s.lng = co.lng;
            }
          }
        });
      }
      setSitters(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!criteria) return sitters;
    const reqWeight = DOG_SIZES.find((d) => d.key === criteria.dogSize)!.maxLbs;
    const list = sitters.filter((s) => {
      // service
      if (
        s.sitter_services &&
        s.sitter_services.length > 0 &&
        !s.sitter_services.includes(criteria.service)
      )
        return false;
      // pet types
      if (criteria.numDogs + criteria.numPuppies > 0 && s.accepts_dogs === false) return false;
      if (criteria.numCats > 0 && s.accepts_cats !== true) return false;
      // weight
      if (s.max_pet_weight_lbs != null && s.max_pet_weight_lbs < reqWeight) return false;
      return true;
    });
    if (criteria.location && criteria.location.lat) {
      list.forEach((s) => {
        if (s.lat && s.lng)
          s.distance = distanceMiles(criteria.location!, { lat: s.lat, lng: s.lng });
      });
      list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    return list;
  }, [sitters, criteria]);

  const pins: Pin[] = useMemo(
    () =>
      filtered
        .filter((s) => s.lat && s.lng)
        .map((s) => ({
          id: s.id,
          name: s.full_name,
          lat: s.lat!,
          lng: s.lng!,
          rate: s.sitter_rate,
          rating: s.avg_rating,
          reviewCount: s.review_count,
          city: s.city,
        })),
    [filtered],
  );

  if (location.pathname !== "/sitters") return <Outlet />;

  const serviceLabel = criteria
    ? SERVICE_TYPES.find((s) => s.key === criteria.service)?.label
    : null;

  const applyLocation = (location: SearchCriteria["location"]) => {
    const nextCriteria = {
      ...(criteria ?? DEFAULT_CRITERIA),
      location,
    };

    setCriteria(nextCriteria);
    saveCriteria(nextCriteria);
    setHighlightId(null);
  };

  const quickLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const q = locationQuery.trim();
    if (!q) return;

    setLocationBusy(true);
    setLocationError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`,
      );

      const json = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      const first = json[0];

      if (!first) {
        setLocationError("No location found. Try a ZIP code, city, or full address.");
        return;
      }

      const nextLocation = {
        label: first.display_name,
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
      };

      setLocationQuery(first.display_name);
      applyLocation(nextLocation);
    } catch {
      setLocationError("Location search failed. Try again.");
    } finally {
      setLocationBusy(false);
    }
  };

  return (
    <SiteLayout>
      {/* Sticky top criteria bar */}
      <section className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWizardOpen(true)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground sm:flex-none"
            >
              <SlidersHorizontal className="h-4 w-4" /> {criteria ? "Filters" : "Start search"}
            </button>
            <div className="flex h-10 items-center gap-2 overflow-x-auto no-scrollbar sm:hidden">
              {criteria && (
                <>
                  <Chip>{serviceLabel}</Chip>
                  <Chip>{DOG_SIZES.find((d) => d.key === criteria.dogSize)?.label}</Chip>
                </>
              )}
            </div>
          </div>

          {criteria && (
            <form onSubmit={quickLocationSearch} className="flex flex-1 items-center gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="ZIP, city, or address"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={locationBusy}
                className="h-10 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted disabled:opacity-50"
              >
                {locationBusy ? "…" : "Search"}
              </button>
            </form>
          )}

          {criteria && (
            <div className="hidden flex-wrap items-center gap-2 text-xs text-muted-foreground sm:flex">
              <Chip>{serviceLabel}</Chip>
              {criteria.location && (
                <Chip>
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {criteria.location.label.split(",")[0]}
                </Chip>
              )}
              {criteria.startDate && (
                <Chip>
                  <CalIcon className="mr-1 inline h-3 w-3" />
                  {criteria.startDate}
                </Chip>
              )}
              <Chip>
                {criteria.numDogs + criteria.numPuppies}🐕 · {criteria.numCats}🐈
              </Chip>
              <Chip>{DOG_SIZES.find((d) => d.key === criteria.dogSize)?.label}</Chip>
            </div>
          )}
          {locationError && <p className="text-[10px] text-destructive sm:basis-full">{locationError}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading sitters…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
            {/* MAP (left) */}
            <div className="relative z-0 min-w-0 lg:sticky lg:top-[68px] lg:h-[calc(100vh-100px)]">
              <SitterMap
                pins={pins}
                center={criteria?.location ?? null}
                highlightId={highlightId}
                onPinClick={(id) => {
                  setHighlightId(id);
                  document
                    .getElementById(`sitter-${id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="h-[18rem] max-h-[45vh] w-full overflow-hidden rounded-2xl border border-border sm:h-[24rem] lg:h-full lg:max-h-none"
              />
              {pins.length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  No sitters with map locations yet in this area.
                </p>
              )}
            </div>

            {/* LIST (right) */}
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                {filtered.length} sitter{filtered.length === 1 ? "" : "s"}{" "}
                {criteria?.location ? "near you" : "available"}
              </p>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No sitters match those filters yet. Try widening your search.
                </div>
              ) : (
                <ul className="space-y-3">
                  {filtered.map((s) => (
                    <li
                      key={s.id}
                      id={`sitter-${s.id}`}
                      onMouseEnter={() => setHighlightId(s.id)}
                      onMouseLeave={() => setHighlightId(null)}
                      className={`rounded-2xl border bg-card p-3 transition-all hover:shadow-warm sm:p-4 ${highlightId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <Link
                          to="/sitters/$sitterId"
                          params={{ sitterId: s.id }}
                          className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16"
                        >
                          {s.avatar_url ? (
                            <img
                              src={s.avatar_url}
                              alt={s.full_name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-secondary text-base font-700 text-secondary-foreground">
                              {s.full_name?.[0] ?? "?"}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to="/sitters/$sitterId"
                                params={{ sitterId: s.id }}
                                className="block truncate font-display text-base font-700 hover:underline sm:text-lg"
                              >
                                {s.full_name}
                              </Link>
                              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                                {s.city}
                                {s.state ? `, ${s.state}` : ""}
                                {s.distance != null && <> · {s.distance.toFixed(1)} mi</>}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 text-sm font-700">
                              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                              {s.review_count ? s.avg_rating!.toFixed(1) : "New"}
                              {s.review_count ? (
                                <span className="font-400 text-muted-foreground">
                                  ({s.review_count})
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] sm:gap-1.5 sm:text-[10px]">
                            {(s.review_count ?? 0) >= 5 && (s.avg_rating ?? 0) >= 4.7 && (
                              <Badge tone="accent">
                                <Star className="h-2.5 w-2.5" /> Star Sitter
                              </Badge>
                            )}
                            <Badge tone="primary">
                              <BadgeCheck className="h-2.5 w-2.5" /> Qualified
                            </Badge>
                            {s.verification_status === "approved" && (
                              <Badge tone="gold">
                                <ShieldCheck className="h-2.5 w-2.5" /> Background checked
                              </Badge>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-xs text-foreground/80 sm:text-sm">
                            {s.sitter_headline ?? s.bio ?? "Trusted JaxStay sitter."}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-700 sm:text-base">
                              {s.sitter_rate != null ? (
                                <>
                                  ${s.sitter_rate}
                                  <span className="text-[10px] font-400 text-muted-foreground sm:text-xs"> / night</span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">Rates on profile</span>
                              )}
                            </p>
                            <div className="flex gap-2">
                              <Link
                                to="/messages"
                                search={{ peer: s.id }}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-600 hover:bg-muted sm:text-xs"
                              >
                                <MessageSquare className="h-3 w-3" /> <span className="hidden sm:inline">Message</span>
                              </Link>
                              <Link
                                to="/sitters/$sitterId"
                                params={{ sitterId: s.id }}
                                className="rounded-full bg-primary px-4 py-1.5 text-[10px] font-600 text-primary-foreground sm:px-3 sm:text-xs"
                              >
                                Book
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <SearchWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onApply={(c) => {
          setCriteria(c);
          saveCriteria(c);
          setLocationQuery(c.location?.label ?? "");
          setHighlightId(null);
          setWizardOpen(false);
        }}
        initial={criteria ?? DEFAULT_CRITERIA}
      />
    </SiteLayout>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-600">{children}</span>;
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "primary" | "accent" | "muted" | "gold";
}) {
  const cls =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "accent"
        ? "bg-accent/20 text-accent-foreground"
        : tone === "gold"
          ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-600 ${cls}`}>
      {children}
    </span>
  );
}
