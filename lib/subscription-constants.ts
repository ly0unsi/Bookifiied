export const PLANS = {
  free: {
    maxBooks: 0,
    maxSessionsPerMonth: 5,
    maxSessionMinutes: 5,
    sessionHistory: false,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxSessionMinutes: 15,
    sessionHistory: true,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: null,
    maxSessionMinutes: 60,
    sessionHistory: true,
  },
} as const;

export type PlanType = keyof typeof PLANS;
