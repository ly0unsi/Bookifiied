"use client";

import { useVapi } from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import { useEffect } from "react";
import { toast } from "sonner";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    start,
    stop,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    limitError,
  } = useVapi(book);

  useEffect(() => {
    if (limitError) toast.error(limitError);
  }, [limitError]);
  return (
    <>
      <section className="vapi-header-card w-full">
        <div className="vapi-cover-wrapper">
          <Image
            src={book.coverURL}
            alt={`${book.title} cover`}
            width={120}
            height={180}
            className="vapi-cover-image h-45! w-30!"
            priority
          />
          <div className="vapi-mic-wrapper">
            {(status === "speaking" || status === "thinking") && (
              <span
                className="vapi-pulse-ring animate-ring"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              disabled={status === "connecting"}
              onClick={isActive ? stop : start}
              className={`vapi-mic-btn ${isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"} shadow-md`}
              aria-label={
                isActive ? "Turn microphone off" : "Turn microphone on"
              }
            >
              {isActive ? (
                <Mic className="size-5 text-white" aria-hidden="true" />
              ) : (
                <MicOff className="size-5 text-[#212a3b]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="font-serif text-2xl font-bold leading-tight text-[#212a3b] sm:text-3xl">
            {book.title}
          </h1>
          <p className="mt-1 text-sm text-[#3d485e] sm:text-base">
            by {book.author}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="vapi-status-indicator">
              <span className="vapi-status-dot vapi-status-dot-ready" />
              <span className="vapi-status-text">{status}</span>
            </span>
            <span className="vapi-badge-ai vapi-badge-ai-text">
              Voice: {book.persona || "Default"}
            </span>
            <span className="vapi-badge-ai vapi-badge-ai-text tabular-nums">
              0:00/15:00
            </span>
          </div>
        </div>
      </section>
      <div className="vapi-transcript-wrapper w-full">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </div>
    </>
  );
};

export default VapiControls;
