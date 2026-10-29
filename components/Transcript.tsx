"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

type TranscriptMessage = {
  role: string;
  content: string;
};

type TranscriptProps = {
  messages: TranscriptMessage[];
  currentMessage: string;
  currentUserMessage: string;
};

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isEmpty =
    messages.length === 0 && !currentMessage && !currentUserMessage;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, currentMessage, currentUserMessage]);

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

  const visibleMessages = [
    ...messages.map((message) => ({ ...message, streaming: false })),
    ...(currentUserMessage
      ? [{ role: "user", content: currentUserMessage, streaming: true }]
      : []),
    ...(currentMessage
      ? [{ role: "assistant", content: currentMessage, streaming: true }]
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
                {message.content}
                {message.streaming && (
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

