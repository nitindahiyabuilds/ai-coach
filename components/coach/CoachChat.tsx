"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type InitialMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type CoachChatProps = {
  initialMessages: InitialMessage[];
};

export default function CoachChat({
  initialMessages,
}: CoachChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>(
  initialMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setError("");

    const userMessage: Message = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (!data.answer) {
        throw new Error("The coach returned an empty response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get a response from the coach."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="min-h-[400px] space-y-4 rounded-xl border p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center text-center">
            <div>
              <h2 className="text-lg font-semibold">Ask your coach</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try asking: “What should I focus on to build muscle?”
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask your health coach..."
          disabled={loading}
          className="flex-1 rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}