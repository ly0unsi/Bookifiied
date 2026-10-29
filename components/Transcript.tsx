"use client";

import { useEffect, useRef } from "react";
import { Mic, Sparkles } from "lucide-react";

type TranscriptMessage = {
  role: string;
  content: string;
};

type TranscriptProps = {
  messages: TranscriptMessage[];
  currentMessage: string;
  currentUserMessage: string;
  isThinking?: boolean;
};

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
  isThinking = false,
}: TranscriptProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isEmpty =
    messages.length === 0 &&
    !currentMessage &&
    !currentUserMessage &&
    !isThinking;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, currentMessage, currentUserMessage, isThinking]);

  if (isEmpty) {
    return (
      <section className="transcript-container">
        <div className="transcript-empty">
          <Mic className="mb-4 size-12 text-[#212a3b]" aria-hidden="true" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </section>
    );
  }

  const visibleMessages: (TranscriptMessage & {
    streaming: boolean;
    thinking?: boolean;
  })[] = [
    ...messages.map((message) => ({ ...message, streaming: false })),
    ...(currentUserMessage
      ? [{ role: "user", content: currentUserMessage, streaming: true }]
      : []),
    ...(currentMessage
      ? [{ role: "assistant", content: currentMessage, streaming: true }]
      : []),
    ...(isThinking
      ? [{ role: "assistant", content: "", streaming: true, thinking: true }]
      : []),
  ];

  return (
    <section
      className="transcript-container"
      aria-label="Conversation transcript"
    >
      <div className="transcript-messages" ref={messagesContainerRef}>
        {visibleMessages.map((message, index) => {
          const isAssistant = message.role === "assistant";

          return (
            <div
              className={`transcript-message ${
                isAssistant
                  ? "transcript-message-assistant"
                  : "transcript-message-user"
              }`}
              key={`${message.role}-${index}`}
            >
              <p
                className={`transcript-bubble ${
                  isAssistant
                    ? "transcript-bubble-assistant"
                    : "transcript-bubble-user"
                }`}
              >
                {message.thinking ? (
                  <span
                    className="inline-flex items-center gap-2"
                    role="status"
                    aria-label="Gemini is thinking"
                  >
                    <span
                      className="inline-flex items-center gap-1"
                      aria-hidden="true"
                    >
                      <span className="size-2 animate-bounce rounded-full bg-[#212a3b] motion-reduce:animate-none" />
                      <span className="size-2 animate-bounce rounded-full bg-[#3d485e] motion-reduce:animate-none [animation-delay:150ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-[#d4a853] motion-reduce:animate-none [animation-delay:300ms]" />
                    </span>
                  </span>
                ) : (
                  message.content
                )}
                {message.streaming && !message.thinking && (
                  <span className="transcript-cursor" aria-hidden="true" />
                )}
              </p>
            </div>
          );
        })}
        <div aria-hidden="true" />
      </div>
    </section>
  );
};

export default Transcript;

