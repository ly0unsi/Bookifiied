import { NextResponse } from "next/server";
import { searchBookSegments } from "@/lib/actions/book.actions";

const NO_MATCHES = "no information found about this topic";

function parseArguments(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isSearchBookCall(name: unknown): boolean {
  return typeof name === "string" && name.toLowerCase().replace(/[\s_-]/g, "") === "searchbook";
}

async function runSearch(parameters: unknown): Promise<{ result: string }> {
  const args = parseArguments(parameters);
  const bookId = args.bookId ?? args.book_id;
  const query = args.query;

  if (bookId == null || query == null || !String(bookId).trim() || !String(query).trim()) {
    return { result: "Missing bookId or query." };
  }

  const search = await searchBookSegments(String(bookId), String(query).trim(), 3);
  if (!search.success || !search.data?.length) {
    return { result: NO_MATCHES };
  }

  return {
    result: search.data
      .map((segment) => segment.content)
      .filter((content): content is string => typeof content === "string" && content.length > 0)
      .join("\n\n") || NO_MATCHES,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;
    const functionCall = message?.functionCall ?? body?.functionCall;

    if (functionCall) {
      const name = functionCall.name ?? functionCall.function?.name;
      if (!isSearchBookCall(name)) {
        return NextResponse.json({ result: `Unknown function: ${String(name ?? "")}` });
      }

      return NextResponse.json(
        await runSearch(functionCall.parameters ?? functionCall.arguments),
      );
    }

    const toolCalls = message?.toolCallList ?? message?.toolCalls ?? body?.toolCallList ?? body?.toolCalls;
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return NextResponse.json({ results: [{ result: "No tool calls found." }] });
    }

    const results = await Promise.all(
      toolCalls.map(async (toolCall: Record<string, unknown>) => {
        const fn = (toolCall.function ?? toolCall) as Record<string, unknown>;
        const name = fn.name;
        const toolCallId = toolCall.id ?? toolCall.toolCallId;

        if (!isSearchBookCall(name)) {
          return { ...(toolCallId ? { toolCallId } : {}), result: `Unknown function: ${String(name ?? "")}` };
        }

        return {
          ...(toolCallId ? { toolCallId } : {}),
          ...(await runSearch(fn.parameters ?? fn.arguments)),
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Vapi search-book error:", error);
    return NextResponse.json(
      { results: [{ result: "Error processing request." }] },
      { status: 400 },
    );
  }
}
