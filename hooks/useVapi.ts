import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/utils";
import { log } from "console";

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const TIME_WARNING_THRESHOLD = 60; // Show warning when this many seconds remain

let vapi: InstanceType<typeof Vapi>;
function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error(
        "NEXT_PUBLIC_VAPI_API_KEY environment variable is not set",
      );
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

type VapiTranscriptEvent = {
  type: "transcript";
  role: "user" | "assistant";
  transcriptType: "partial" | "final";
  transcript: string;
};

const isVapiTranscriptEvent = (
  message: unknown,
): message is VapiTranscriptEvent => {
  if (!message || typeof message !== "object") return false;

  const event = message as Record<string, unknown>;
  return (
    event.type === "transcript" &&
    (event.role === "user" || event.role === "assistant") &&
    (event.transcriptType === "partial" || event.transcriptType === "final") &&
    typeof event.transcript === "string"
  );
};

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const closeSessionRef = useRef<(() => void) | null>(null);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;

  useEffect(() => {
    let client: Vapi;

    try {
      client = getVapi();
    } catch (error) {
      console.error("Vapi setup error", error);
      setLimitError("Voice calling is not configured. Please try again later.");
      return;
    }

    const clearTimers = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      timerRef.current = null;
      startTimerRef.current = null;
    };

    const closeSession = () => {
      clearTimers();
      setStatus("idle");
      setCurrentMessage("");
      setCurrentUserMessage("");

      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sessionId) {
        void endVoiceSession(sessionId).catch((error) => {
          console.error("Error closing voice session", error);
        });
      }
    };
    closeSessionRef.current = closeSession;

    const handleCallStart = () => {
      setStatus("listening");
      setLimitError(null);
    };

    const handleCallEnd = () => {
      closeSession();
      isStoppingRef.current = false;
    };

    const handleSpeechStart = () => setStatus("speaking");
    const handleSpeechEnd = () => setStatus("listening");

    const handleMessage = (message: unknown) => {
      const event = message as
        | { type?: unknown; status?: unknown }
        | null
        | undefined;

      if (event?.type === "status-update" && event.status === "ended") {
        closeSession();
        return;
      }

      if (!isVapiTranscriptEvent(message) || !message.transcript.trim()) return;

      const { role, transcript, transcriptType } = message;

      if (transcriptType === "partial") {
        if (role === "assistant") {
          setCurrentMessage(transcript);
        } else {
          setCurrentUserMessage(transcript);
        }
        return;
      }

      if (role === "assistant") {
        setCurrentMessage("");
      } else {
        setCurrentUserMessage("");
        setStatus("thinking");
      }

      setMessages((previous) => {
        const duplicate = previous.some(
          (item) => item.role === role && item.content === transcript,
        );
        return duplicate
          ? previous
          : [...previous, { role, content: transcript }];
      });
    };

    const handleCallStartFailed = (event: { error?: string }) => {
      setLimitError(event.error || "Could not start the voice call.");
      closeSession();
    };

    const handleError = (event: any) => {
      console.log("msg1", event?.message);
      console.log("msg2", event?.error);

      const nestedError = event?.error;

      const meetingEnded = nestedError.type == "ejected";

      if (meetingEnded) {
        console.warn("Vapi call ended");
        setLimitError("The voice call ended. You can start a new call.");
      } else {
        console.error("Vapi call error", event);
        setLimitError("A voice call error occurred. Please try again.");
      }
      closeSession();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const detail =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : String(reason ?? "");

      if (!/meeting ended due to ejection:\s*meeting has ended/i.test(detail)) {
        return;
      }

      // Daily can reject a pending operation after Vapi has already ended the
      // meeting. Treat that as a completed call instead of a route-level error.
      event.preventDefault();
      console.warn("Vapi meeting had already ended", reason);
      setLimitError("The voice call ended. You can start a new call.");
      closeSession();
    };

    client.on("call-start", handleCallStart);
    client.on("call-end", handleCallEnd);
    client.on("speech-start", handleSpeechStart);
    client.on("speech-end", handleSpeechEnd);
    client.on("message", handleMessage);
    client.on("call-start-failed", handleCallStartFailed);
    client.on("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      closeSessionRef.current = null;
      client.removeListener("call-start", handleCallStart);
      client.removeListener("call-end", handleCallEnd);
      client.removeListener("speech-start", handleSpeechStart);
      client.removeListener("speech-end", handleSpeechEnd);
      client.removeListener("message", handleMessage);
      client.removeListener("call-start-failed", handleCallStartFailed);
      client.removeListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  //* Limits:
  // const maxDurationRef = useRef(limits.maxSessionMinutes * 60)
  // const maxDurationSeconds
  // const remainingSeconds
  // const showTimeWarning

  const start = async () => {
    if (!userId) return setLimitError("Please login to start a conversation");

    setLimitError(null);
    setStatus("connecting");

    try {
      const result = await startVoiceSession(userId, book._id);
      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan.",
        );
        // setIsBillingError(!!result.isBillingError);
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;
      const firstMessage = `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;
      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: getVoice(voice).id,
          model: "eleven_turbo_v2_5" as const,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });
    } catch (e) {
      console.error("Error starting call", e);
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sessionId) void endVoiceSession(sessionId);
      setStatus("idle");
      setLimitError("An error occurred while starting the call");
    }
  };
  const stop = async () => {
    isStoppingRef.current = true;
    try {
      await getVapi().stop();
    } catch (e) {
      console.error("Error stopping call", e);
    } finally {
      closeSessionRef.current?.();
      isStoppingRef.current = false;
    }
  };
  const sendTextMessage = (content: string) => {
    if (!isActive) return false;

    getVapi().send({
      type: "add-message",
      message: { role: "user", content },
    });
    setMessages((previous) => [...previous, { role: "user", content }]);
    return true;
  };
  const appendMessage = (message: Messages) => {
    setMessages((previous) => [...previous, message]);
  };
  const clearErrors = async () => {};

  return {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    limitError,
    start,
    stop,
    sendTextMessage,
    appendMessage,
    clearErrors,
    // maxDurationSeconds, remainingSeconds, showTimeWarning
  };
};
