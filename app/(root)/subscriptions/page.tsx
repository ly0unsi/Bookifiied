import { PricingTable } from "@clerk/nextjs";

export default function SubscriptionsPage() {
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
      >
        <PricingTable
          for="user"
          highlightedPlan="standard"
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
