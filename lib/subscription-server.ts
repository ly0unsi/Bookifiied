import { auth } from "@clerk/nextjs/server";
import { getPlanFromHas } from "@/lib/subscription-utils";

export const getUserPlan = async () => {
  const { has } = await auth();
  return getPlanFromHas(has);
};
