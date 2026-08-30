import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { getCoachMessages } from "@/lib/memory/coach";
import CoachChat from "@/components/coach/CoachChat";

export default async function CoachPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signup");
  }

  const messages = await getCoachMessages(50);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Coach</h1>

          <p className="mt-2 text-muted-foreground">
            Ask your AI Coach anything about your health, nutrition, or
            fitness goals.
          </p>
        </div>

        <CoachChat initialMessages={messages} />
      </div>
    </main>
  );
}