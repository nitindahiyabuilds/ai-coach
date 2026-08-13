import CoachChat from "@/components/coach/CoachChat";

export default function CoachPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Health Coach</h1>
          <p className="mt-2 text-muted-foreground">
            Ask your AI OS coach anything about your health, nutrition, or
            fitness goals.
          </p>
        </div>

        <CoachChat />
      </div>
    </main>
  );
}