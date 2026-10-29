"use client";

import { useVapi } from "@/hooks/useVapi";
import { IBook } from "@/types";
import {
  ArrowUp,
  LoaderCircle,
  Mic,
  MicOff,
} from "lucide-react";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import { FormEvent, useEffect, useState } from "react";
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
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (limitError) toast.error(limitError);
  }, [limitError]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = chatInput.trim();
    if (!query || isSending) return;

    setChatInput("");
    setChatMessages((previous) => [
      ...previous,
      { role: "user", content: query },
    ]);
    setIsSending(true);

    try {
      const response = await fetch("/api/vapi/search-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            toolCallList: [
              {
                id: crypto.randomUUID(),
                function: {
                  name: "search book",
                  arguments: { bookId: book._id, query, synthesize: true },
                },
              },
            ],
          },
        }),
      });
      const payload = await response.json();
      const result = payload?.results?.[0]?.result;
      if (!response.ok || typeof result !== "string") {
        throw new Error("Could not get an answer. Please try again.");
      }
      setChatMessages((previous) => [
        ...previous,
        { role: "assistant", content: result },
      ]);
    } catch (error) {
      console.error("Book chat error", error);
      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Could not get an answer. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const transcriptMessages = [...messages, ...chatMessages];
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
            {(status === "listening" ||
              status === "speaking" ||
              status === "thinking") && (
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
          messages={transcriptMessages}
          currentMessage={isSending ? "Searching the book…" : currentMessage}
          currentUserMessage={currentUserMessage}
        />
        <div className="rounded-b-[14px] bg-[#f3e4c7] p-3 sm:p-4">
          <form
            onSubmit={sendMessage}
            className="flex w-full items-center gap-3 rounded-full border border-[rgba(33,42,59,0.16)] bg-[#fff6e5] px-4 py-2.5 text-[#212a3b] shadow-sm sm:px-5"
          >
            <label className="sr-only" htmlFor="book-chat-input">
              Ask a question about this book
            </label>
            <input
              id="book-chat-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about this book"
              disabled={isSending}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#212a3b] outline-none placeholder:text-[#6b7280] disabled:opacity-60"
            />
            <button
              type="button"
              disabled={status === "connecting"}
              onClick={isActive ? stop : start}
              aria-label={
                isActive ? "Turn microphone off" : "Turn microphone on"
              }
              className="relative isolate flex size-9 shrink-0 items-center justify-center rounded-full text-[#3d485e] transition hover:bg-[#212a3b]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(status === "listening" || status === "speaking") && (
                <span
                  className="absolute inset-0 z-0 rounded-full bg-[#212a3b]/20 animate-ring"
                  aria-hidden="true"
                />
              )}
              {isActive ? (
                <MicOff className="relative z-10 size-5" aria-hidden="true" />
              ) : (
                <Mic className="relative z-10 size-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="submit"
              disabled={!chatInput.trim() || isSending}
              aria-label="Send message"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#212a3b] text-white transition hover:bg-[#3d485e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default VapiControls;
