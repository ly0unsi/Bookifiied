import type { PlanType } from "@/lib/subscription-constants";

type PlanCheck = (params: { plan: string }) => boolean;

export const getPlanFromHas = (has: PlanCheck): PlanType => {
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "standard" })) return "standard";
  return "free";
};
