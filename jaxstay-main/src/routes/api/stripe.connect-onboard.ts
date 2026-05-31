import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getOrigin, getAdmin } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/stripe/connect-onboard")({
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

          const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("id, email, full_name, stripe_account_id")
            .eq("id", userId)
            .single();

          if (profileError || !profile) {
            return new Response(
              `Profile not found for user ${userId}${profileError?.message ? ` - ${profileError.message}` : ""}`,
              {
                status: 404,
              }
            );
          }

          const stripe = getStripe();
          let accountId = profile.stripe_account_id;

          if (!accountId) {
            const account = await stripe.accounts.create({
              type: "express",
              email: profile.email ?? undefined,
              business_type: "individual",
              capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
              },
              metadata: {
                user_id: userId,
                profile_id: profile.id,
              },
            });

            accountId = account.id;

            const { error: updateError } = await admin
              .from("profiles")
              .update({
                stripe_account_id: accountId,
              })
              .eq("id", userId);

            if (updateError) {
              return new Response(`Could not save Stripe account: ${updateError.message}`, {
                status: 500,
              });
            }
          }

          const origin = getOrigin(request);

          const link = await stripe.accountLinks.create({
            account: accountId,
            type: "account_onboarding",
            refresh_url: `${origin}/dashboard?stripe=refresh`,
            return_url: `${origin}/dashboard?stripe=connected`,
          });

          return Response.json({
            url: link.url,
          });
        } catch (error) {
          return new Response(
            error instanceof Error ? error.message : "Unknown Stripe onboarding error",
            {
              status: 500,
            }
          );
        }
      },
    },
  },
});