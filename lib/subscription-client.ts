"use client";

import { useAuth } from "@clerk/nextjs";
import { getPlanFromHas } from "@/lib/subscription-utils";

export const useSubscriptionPlan = () => {
  const { has, isLoaded } = useAuth();

  return {
    plan: isLoaded ? getPlanFromHas(has) : null,
    isLoaded,
  };
};
