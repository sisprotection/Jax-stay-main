import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — JaxStay" },
      { name: "description", content: "JaxStay terms of service." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <article className="prose mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-700">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: May 2026 — please review with legal counsel before launch.
        </p>

        <Section title="1. Acceptance">
          By creating a JaxStay account or using the platform, you agree to these
          Terms. JaxStay is a marketplace that connects pet owners with
          independent pet sitters. Sitters are independent service providers and
          are not employees of JaxStay.
        </Section>

        <Section title="2. Eligibility">
          You must be 18 years or older and able to enter a binding contract to
          use JaxStay. You agree to provide accurate account, profile, booking,
          payment, and contact information.
        </Section>

        <Section title="3. Marketplace relationship">
          JaxStay provides tools for owners and sitters to find each other,
          communicate, request bookings, accept bookings, and process payments.
          JaxStay is not a veterinary provider, boarding facility, insurance
          company, or employer of sitters.
        </Section>

        <Section title="4. Booking requests and acceptance">
          Owners may send booking requests to sitters. A booking is not accepted
          until the sitter accepts it through the platform. Owners are not charged
          simply for sending a booking request.
        </Section>

        <Section title="5. Payments and platform fee">
          Payments are processed through Stripe. After a sitter accepts a booking,
          the owner may be asked to pay through JaxStay. JaxStay may charge a 15%
          platform and payment-handling fee. This fee supports platform
          operations, payment handling, safety tools, support, and marketplace
          management.
        </Section>

        <Section title="6. Holding funds and sitter payouts">
          Client payments may be held until the booking is completed, confirmed,
          or otherwise resolved. Sitters are not automatically paid the moment an
          owner pays. Sitter payouts may be released after the booking is
          completed, both parties have had a chance to confirm completion, and no
          dispute, cancellation review, or refund review is pending.
        </Section>

        <Section title="7. Refunds and cancellations">
          If an owner cancels before payment is processed, no refund is required
          because no payment has been collected.
          {" "}
          If an owner cancels after payment but before the service begins,
          JaxStay may refund the sitter portion of the booking while retaining
          the 15% platform and payment-handling fee. Once payment is processed,
          JaxStay’s 15% platform and payment-handling fee may be non-refundable
          unless JaxStay decides otherwise or applicable law requires otherwise.
          {" "}
          If a sitter cancels after payment has been processed, JaxStay may issue
          a full or partial refund to the owner and may record a cancellation
          mark on the sitter’s account.
          {" "}
          If a booking has already started, refund requests may require admin
          review. JaxStay may consider booking records, messages, cancellation
          reasons, owner confirmations, sitter confirmations, and other available
          information before deciding whether any refund applies.
        </Section>

        <Section title="8. Cancellations, disputes, and account history">
          JaxStay may track cancellation history, refund requests, late
          cancellations, sitter reliability, owner reliability, disputes, and
          completion confirmations. This information may be used to protect users,
          review accounts, improve platform safety, and make marketplace
          decisions.
        </Section>

        <Section title="9. User conduct">
          You agree to treat other users with respect, provide accurate
          information, communicate honestly, and follow all applicable laws. You
          may not use JaxStay to harass, threaten, scam, stalk, abuse, or exploit
          another person or animal. We may suspend or remove accounts that violate
          these Terms or create risk for other users.
        </Section>

        <Section title="10. Pet care and emergencies">
          Owners are responsible for providing accurate pet care instructions,
          emergency contacts, medication instructions, and veterinary information.
          Sitters agree to follow owner instructions, act responsibly, and contact
          the owner and appropriate emergency services or veterinary support when
          necessary.
        </Section>

        <Section title="11. Verification and safety">
          JaxStay may offer profile verification, sitter testing, background
          verification uploads, reviews, ratings, and safety tools. These tools
          help support trust, but JaxStay does not guarantee any sitter’s conduct,
          qualifications, availability, or performance.
        </Section>

        <Section title="12. Messages and uploaded content">
          Users may send messages and upload photos or documents through the
          platform. You are responsible for content you send or upload. You may
          not upload illegal, abusive, misleading, or harmful content. JaxStay may
          review content when needed for safety, dispute resolution, fraud
          prevention, or legal compliance.
        </Section>

        <Section title="13. Live pet tracking">
          JaxStay may offer optional Live Pet Tracking. A sitter must opt in to
          location sharing for a booking before any location request can be made.
          JaxStay does not passively track sitters in the background. Location
          requests are booking-scoped, consent-based, and may require manual
          approval by the sitter. Live tracking is not an emergency service and
          does not replace calling 911, animal control, or a veterinarian when
          needed.
        </Section>

        <Section title="14. Account deletion">
          You may delete your account from Settings. Account deletion may remove
          your profile, pets, photos, messages, and other account data, but
          JaxStay may retain records when needed for payment records, legal
          compliance, fraud prevention, dispute resolution, or platform safety.
        </Section>

        <Section title="15. Disclaimer">
          JaxStay provides a marketplace platform and related tools. JaxStay does
          not provide veterinary care, insurance, or a guarantee of any sitter,
          owner, pet, booking, or outcome. Use the platform at your own risk.
        </Section>

        <Section title="16. Limitation of liability">
          To the maximum extent permitted by law, JaxStay is not liable for
          indirect, incidental, special, consequential, or punitive damages
          arising out of bookings, sitter conduct, owner conduct, pet behavior,
          payment issues, cancellations, disputes, or use of the platform.
        </Section>

        <Section title="17. Termination">
          JaxStay may suspend, restrict, or terminate accounts that violate these
          Terms, create safety concerns, misuse the platform, fail verification,
          create payment risk, or harm other users.
        </Section>

        <Section title="18. Contact">
          Questions: support@jaxstay.example
        </Section>
      </article>
    </SiteLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl font-600">{title}</h2>
      <p className="mt-2 leading-relaxed text-foreground/80">{children}</p>
    </div>
  );
}