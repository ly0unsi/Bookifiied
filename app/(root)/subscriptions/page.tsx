"use client";

import { useEffect } from "react";
import { PricingTable } from "@clerk/nextjs";
import { useSubscriptionPlan } from "@/lib/subscription-client";

export default function SubscriptionsPage() {
  const { plan } = useSubscriptionPlan();

  useEffect(() => {
    console.log(
      "Current subscription plan:",
      plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : undefined,
    );
  }, [plan]);

  return (
    <main className="wrapper container">
      <section className="flex flex-col gap-5 text-center">
        <h1 className="page-title-xl">Pricing</h1>
        <p className="subtitle">
          Choose a plan that fits your reading and listening habits.
        </p>
      </section>
      <section
        className="clerk-pricing-table-wrapper subscription-pricing"
        aria-label="Subscription plans"
        data-current-plan={plan ?? undefined}
      >
        <PricingTable
          for="user"
          highlightedPlan={plan ?? undefined}
          appearance={{
            variables: {
              colorPrimary: "#212a3b",
              colorBackground: "#ffffff",
            },
          }}
        />
      </section>
    </main>
  );
}
