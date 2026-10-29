"use server";

import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import { auth } from "@clerk/nextjs/server";
import type { EndSessionResult, StartSessionResult } from "@/types";
import { PLANS } from "@/lib/subscription-constants";
import { getPlanFromHas } from "@/lib/subscription-utils";

const getCurrentBillingPeriodStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId, has } = await auth();
    if (!userId || userId !== clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const plan = getPlanFromHas(has);
    const planLimits = PLANS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();
    const currentCount = await VoiceSession.countDocuments({
      clerkId: userId,
      billingPeriodStart,
    });

    if (
      planLimits.maxSessionsPerMonth !== null &&
      currentCount >= planLimits.maxSessionsPerMonth
    ) {
      return {
        success: false,
        error: `Your ${plan} plan's monthly session limit has been reached. Upgrade your plan to continue.`,
        isBillingError: true,
      };
    }

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: planLimits.maxSessionMinutes,
    };
  } catch (e) {
    console.error("Error starting voice session", e);
    return {
      success: false,
      error: "Failed to start voice session. Please try again later.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
): Promise<EndSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const session = await VoiceSession.findOne({
      _id: sessionId,
      clerkId: userId,
    });

    if (!session) {
      return { success: false, error: "Voice session not found" };
    }

    if (!session.endedAt) {
      const endedAt = new Date();
      session.endedAt = endedAt;
      session.durationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
      );
      await session.save();
    }

    return { success: true };
  } catch (e) {
    console.error("Error ending voice session", e);
    return {
      success: false,
      error: "Failed to end voice session. Please try again later.",
    };
  }
};
