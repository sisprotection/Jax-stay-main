import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  MessageCircle,
  CalendarCheck,
  Heart,
  Shield,
  CreditCard,
  Camera,
  Phone,
  BadgeCheck,
  ShieldCheck,
  Info,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How JaxStay Works — Booking, Safety & Payments" },
      {
        name: "description",
        content:
          "From search to wagging tail: how JaxStay matches pet parents with trusted sitters, with secure payments, sitter badges, and support.",
      },
    ],
  }),
  component: HowPage,
});

function HowPage() {
  const steps = [
    {
      icon: Search,
      t: "Tell us about your pet",
      d: "Share the service you need, dates, times, pet details, and any special care instructions.",
    },
    {
      icon: MessageCircle,
      t: "Browse and message",
      d: "Read sitter profiles, review badges, compare services, and message sitters before booking.",
    },
    {
      icon: CalendarCheck,
      t: "Book and pay securely",
      d: "Send a booking request. Once the sitter accepts, pay through JaxStay so the booking is confirmed.",
    },
    {
      icon: Heart,
      t: "Complete the stay safely",
      d: "Fill out the pet intake form, stay connected with your sitter, and confirm completion when your pet is back.",
    },
  ];

  const safety = [
    {
      icon: Shield,
      t: "Qualified sitters",
      d: "Sitters can complete JaxStay’s sitter safety qualification test before being listed.",
    },
    {
      icon: CreditCard,
      t: "Secure payments",
      d: "Pay through JaxStay. Funds are held until the booking is completed, then payout is released.",
    },
    {
      icon: Camera,
      t: "Pet intake details",
      d: "Owners can share feeding, medical, emergency, behavior, and safety details with their sitter.",
    },
    {
      icon: Phone,
      t: "Support and moderation",
      d: "Support cases, admin review, and moderator tools help JaxStay handle issues responsibly.",
    },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-600 uppercase tracking-wider text-accent">
          How JaxStay Works
        </p>

        <h1 className="mt-3 text-balance font-display text-5xl font-700 sm:text-6xl">
          Booking great pet care should be{" "}
          <span className="italic text-primary">simple.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/75">
          Whether it is boarding, daycare, drop-ins, walks, or pet
          transportation, JaxStay helps pet owners connect with sitters using
          clear profiles, secure payments, and safety-focused tools.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div
              key={s.t}
              className="grid gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className="font-display text-6xl font-700 text-accent">
                0{i + 1}
              </div>

              <div>
                <h3 className="font-display text-2xl font-600">{s.t}</h3>
                <p className="mt-2 text-foreground/75">{s.d}</p>
              </div>

              <s.icon className="hidden h-10 w-10 text-primary sm:block" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-warm py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-600 uppercase tracking-wider text-accent">
              The JaxStay Promise
            </p>

            <h2 className="mt-2 text-balance font-display text-4xl font-700 sm:text-5xl">
              Built on trust. Backed by real protection.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {safety.map((s) => (
              <div key={s.t} className="rounded-3xl bg-card p-6">
                <s.icon className="h-7 w-7 text-primary" />
                <h3 className="mt-4 font-display text-lg font-600">{s.t}</h3>
                <p className="mt-2 text-sm text-foreground/75">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-600 uppercase tracking-wider text-accent">
              Badges and verification
            </p>

            <h2 className="mt-2 text-balance font-display text-4xl font-700">
              What JaxStay badges mean
            </h2>

            <p className="mt-3 text-foreground/75">
              JaxStay uses badges to help pet owners understand a sitter’s
              current qualification and background-check status. These badges
              are meant to help owners make informed decisions, but owners
              should still review profiles, ask questions, use JaxStay
              messaging, and choose the sitter they feel most comfortable with.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-background p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <h3 className="font-display text-xl font-700">
                    Qualified Sitter
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sitter safety test passed
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                A Qualified Sitter has passed JaxStay’s sitter qualification
                test. The test covers pet safety, emergency response,
                transportation safety, medication instructions, communication,
                escapes/bolting, and responsible care.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/15 p-3">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                </div>

                <div>
                  <h3 className="font-display text-xl font-700">
                    Background Check Completed
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reviewed by JaxStay admin/moderators
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                Background Check Completed means the sitter submitted
                background-check documentation and JaxStay admin or moderators
                reviewed and approved it. This badge is separate from the
                sitter qualification test.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              Badges are helpful safety signals, but they are not a guarantee.
              Pet owners should still communicate clearly, review sitter
              details, share accurate pet intake information, and use JaxStay’s
              booking and payment system.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-700 sm:text-5xl">
          Ready when you are.
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/sitters"
            className="rounded-full bg-primary px-7 py-3.5 text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
          >
            Find a sitter
          </Link>

          <Link
            to="/become-a-sitter"
            className="rounded-full border border-border px-7 py-3.5 text-sm font-600 hover:bg-muted"
          >
            Become a sitter
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}