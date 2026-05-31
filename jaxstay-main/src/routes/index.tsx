import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Shield, MessageCircle, CalendarCheck, Star, Heart, Camera } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { SitterCard } from "@/components/site/SitterCard";
import { PawIcon } from "@/components/site/Logo";
import { sitters } from "@/data/sitters";
import heroDog from "@/assets/hero-dog.jpg";
import dogCta from "@/assets/dog-cta.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JaxStay — Trusted dog sitters who treat them like family" },
      { name: "description", content: "Book loving, vetted dog sitters near you. Boarding, daycare, walks, and drop-in visits — with photo updates, secure payments, and 24/7 support." },
      { property: "og:title", content: "JaxStay — Trusted dog sitters near you" },
      { property: "og:description", content: "Loving sitters. Happy dogs. Peace of mind." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <Hero />
      <TrustBar />
      <FeaturedSitters />
      <HowItWorks />
      <Services />
      <JaxInspiration />
      <SitterCTA />
      <Testimonials />
      <FinalCTA />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden paw-bg">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-16 sm:gap-12 sm:px-6 sm:pt-12 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-20 lg:pb-28">
        <div className="lg:col-span-6 lg:pt-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-600 text-foreground/80 sm:text-xs">
            <PawIcon className="h-3.5 w-3.5 text-accent" /> Trusted by 240,000+ dog parents
          </span>
          <h1 className="mt-5 font-display text-4xl font-700 leading-[1.05] tracking-tight text-foreground sm:text-6xl sm:leading-[0.95] lg:text-7xl text-balance">
            Loving sitters.<br />
            <span className="italic text-primary">Happy dogs.</span><br />
            <span className="text-accent">Peace of mind.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-foreground/75 sm:text-lg text-balance">
            Book vetted, 5-star dog sitters near you for boarding, daycare, walks, and drop-ins —
            with daily photo updates and the JaxStay Promise on every stay.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-2 shadow-soft">
            <form className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]">
              <label className="flex items-center gap-2 rounded-xl px-3 py-3 transition-colors focus-within:bg-muted hover:bg-muted">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="ZIP code or city"
                  defaultValue="Brooklyn, NY"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl px-3 py-3 transition-colors focus-within:bg-muted hover:bg-muted">
                <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                <select className="w-full bg-transparent text-sm outline-none">
                  <option>Boarding</option>
                  <option>Daycare</option>
                  <option>House sitting</option>
                  <option>Drop-in visits</option>
                  <option>Dog walking</option>
                </select>
              </label>
              <Link
                to="/sitters"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-600 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] sm:py-3"
              >
                <Search className="h-4 w-4" /> Search
              </Link>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground/70 sm:text-sm">
            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Background-checked</div>
            <div className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" /> 4.9 avg rating</div>
          </div>
        </div>

        <div className="relative mt-8 lg:col-span-6 lg:mt-0">
          <div className="relative overflow-hidden rounded-[2rem] shadow-warm">
            <img
              src={heroDog}
              alt="Happy golden retriever in golden hour light"
              width={1600}
              height={1200}
              className="aspect-[4/5] w-full object-cover sm:aspect-video lg:aspect-[4/5]"
            />
          </div>
          <div className="absolute -left-4 bottom-12 hidden rounded-2xl bg-card p-4 shadow-soft sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/20">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-600">Daily photo updates</div>
                <div className="text-xs text-muted-foreground">Never miss a tail wag</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-2 top-8 hidden rounded-2xl bg-card p-4 shadow-soft sm:block">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 fill-accent text-accent" />
              <div>
                <div className="text-sm font-600">98% rebook rate</div>
                <div className="text-xs text-muted-foreground">Your dog will love them</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { v: "240k+", l: "Happy dog parents" },
    { v: "18k", l: "Vetted sitters" },
    { v: "4.9★", l: "Average rating" },
    { v: "$0", l: "No cancel fees" },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 gap-x-4 px-4 py-8 sm:grid-cols-4 sm:px-6 sm:py-10 lg:px-8">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-2xl font-700 text-primary sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedSitters() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-600 uppercase tracking-wider text-accent sm:text-sm">Top-rated near you</p>
          <h2 className="mt-2 font-display text-3xl font-700 text-foreground sm:text-5xl">Meet your next favorite sitter</h2>
        </div>
        <Link to="/sitters" className="text-sm font-600 text-primary underline-offset-4 hover:underline">
          Browse all sitters →
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {sitters.slice(0, 3).map((s) => (
          <SitterCard key={s.id} sitter={s} />
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Search, t: "Search & match", d: "Tell us about your dog and find sitters who fit your needs and schedule." },
    { icon: MessageCircle, t: "Meet & greet", d: "Message any sitter, schedule a free meet & greet, and ask anything." },
    { icon: CalendarCheck, t: "Book & relax", d: "Pay securely through JaxStay. Get photo updates and 24/7 vet support." },
  ];
  return (
    <section className="bg-gradient-warm py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-600 uppercase tracking-wider text-accent sm:text-sm">How JaxStay works</p>
          <h2 className="mt-2 font-display text-3xl font-700 sm:text-5xl">Three steps to a happy tail</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="relative rounded-3xl bg-card p-6 shadow-soft sm:p-8">
              <div className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-base font-700 text-primary-foreground sm:-top-5 sm:left-8 sm:h-10 sm:w-10 sm:text-lg">
                {i + 1}
              </div>
              <s.icon className="mt-2 h-7 w-7 text-accent sm:h-8 sm:w-8" />
              <h3 className="mt-4 font-display text-xl font-600 sm:text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm text-foreground/75 sm:text-base">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { t: "Boarding", d: "Overnight stays in your sitter's home", price: "from $40/night", emoji: null as string | null, to: "/sitters" as const },
    { t: "House sitting", d: "Sitter stays at your place", price: "from $55/night", emoji: null, to: "/sitters" as const },
    { t: "Drop-in visits", d: "30 or 60-min check-ins", price: "from $20/visit", emoji: null, to: "/sitters" as const },
    { t: "Doggy daycare", d: "Day-long care while you work", price: "from $35/day", emoji: null, to: "/sitters" as const },
    { t: "Dog walking", d: "Solo walks tailored to your pup", price: "from $18/walk", emoji: null, to: "/sitters" as const },
    { t: "Puppy training", d: "Basic obedience with certified trainers", price: "from $60/session", emoji: null, to: "/sitters" as const },
    { t: "Pet Transportation", d: "Book a trusted sitter to safely transport your pet to the vet, groomer, or anywhere you need.", price: "from $15/trip", emoji: "🚗", to: "/sitters" as const, cta: "Book Transport" as const },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-3 md:grid-cols-2 md:items-end">
        <h2 className="font-display text-4xl font-700 sm:text-5xl text-balance">
          Every kind of care, from quick walks to long stays.
        </h2>
        <p className="text-foreground/75">
          Whether you're heading to work or jetting off for two weeks, you'll find a sitter
          ready to give your dog the same routine, love, and attention they get from you.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.t} className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl font-600">{s.emoji ? <span className="mr-1">{s.emoji}</span> : null}{s.t}</h3>
              <PawIcon className="h-5 w-5 text-accent transition-transform group-hover:rotate-12" />
            </div>
            <p className="mt-2 text-sm text-foreground/75">{s.d}</p>
            <p className="mt-4 text-sm font-600 text-primary">{s.price}</p>
            {"cta" in s && s.cta && (
              <Link to={s.to} search={{ service: "transport" } as never} className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-600 text-primary-foreground">
                {s.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function JaxInspiration() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="grid items-center gap-8 rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:rounded-[2.5rem] md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div className="overflow-hidden rounded-2xl bg-muted shadow-soft sm:rounded-[2rem]">
          <img
            src="/jax-inspiration.jpg"
            alt="Jax, the inspiration behind JaxStay"
            loading="lazy"
            className="aspect-square h-full max-h-[400px] w-full object-cover md:aspect-auto md:max-h-[540px]"
          />
        </div>

        <div>
          <p className="text-xs font-700 uppercase tracking-wider text-accent sm:text-sm">
            Inspired by Jax
          </p>

          <h2 className="mt-3 text-balance font-display text-3xl font-700 sm:text-5xl">
            Built for pets who are family.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-foreground/75 sm:text-base">
            JaxStay was inspired by Jax — a reminder that pets are not just
            animals we care for, they are family. That is why this platform is
            being built around trust, safety, communication, secure payments,
            and sitters who take pet care seriously.
          </p>

          <p className="mt-4 hidden text-sm leading-relaxed text-foreground/75 sm:block sm:text-base">
            Every feature, from pet intake forms to sitter qualification badges,
            booking protection, support cases, and payout controls, is designed
            to help pet owners feel more confident when choosing care.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/how-it-works"
              className="rounded-full bg-primary px-6 py-3.5 text-center text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03] sm:py-3"
            >
              See how JaxStay works
            </Link>

            <Link
              to="/sitters"
              className="rounded-full border border-border px-6 py-3.5 text-center text-sm font-600 hover:bg-muted sm:py-3"
            >
              Find a sitter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SitterCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-forest text-primary-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-600 uppercase tracking-wider text-accent">Earn doing what you love</p>
          <h2 className="mt-2 font-display text-4xl font-700 sm:text-5xl text-balance">
            Turn your love of dogs into <span className="italic text-accent">$1,000+ a month</span>.
          </h2>
          <p className="mt-4 max-w-lg text-primary-foreground/80">
            Set your own rates and schedule. We handle bookings, payments, and insurance — so you can
            focus on the cuddles. Top sitters earn over $3,000/month.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/become-a-sitter"
              className="rounded-full bg-accent px-6 py-3 text-sm font-600 text-accent-foreground shadow-warm transition-transform hover:scale-[1.03]"
            >
              Become a sitter
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-600 text-primary-foreground hover:bg-primary-foreground/10"
            >
              See how it works
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src={dogCta}
            alt="Happy corgi"
            loading="lazy"
            className="mx-auto w-full max-w-md animate-float drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: "Emma & Biscuit", text: "Maya treated Biscuit like her own. The photo updates made our trip 100x more relaxing.", rating: 5 },
    { name: "James & Olive", text: "Five stars feels insufficient. Diego is a trail-running miracle worker for our husky.", rating: 5 },
    { name: "Aisha & Mochi", text: "Our senior pup needed special care and Linda was an absolute angel. We cried picking him up — happy tears.", rating: 5 },
  ];
  return (
    <section className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-3xl text-center font-display text-4xl font-700 sm:text-5xl text-balance">
          The kind of reviews that make tails wag.
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-3xl bg-card p-7 shadow-soft">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-4 font-display text-lg leading-snug text-foreground/90">"{r.text}"</p>
              <p className="mt-4 text-sm font-600 text-muted-foreground">— {r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="rounded-[2.5rem] bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
        <PawIcon className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-4 font-display text-4xl font-700 sm:text-5xl text-balance">
          Your dog deserves a home away from home.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Find a sitter in your neighborhood today. Free to join, no booking fees for owners.
        </p>
        <Link
          to="/sitters"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-600 text-accent-foreground shadow-warm transition-transform hover:scale-[1.03]"
        >
          Find your sitter <Search className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
