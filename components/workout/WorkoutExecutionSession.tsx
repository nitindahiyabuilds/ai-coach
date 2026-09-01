"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWorkoutSet } from "@/lib/workout/actions";
import type { WorkoutPlan } from "@/lib/planning/workout-plan";
import type {
  WorkoutSession,
  WorkoutSet,
} from "@/lib/workout/workout";

type WorkoutExecutionSessionProps = {
  session: WorkoutSession;
  plan: WorkoutPlan;
};

function getExerciseSets(
  sets: WorkoutSet[],
  exerciseName: string
): WorkoutSet[] {
  return sets
    .filter((set) => set.exercise_name === exerciseName)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
}

export default function WorkoutExecutionSession({
  session,
  plan,
}: WorkoutExecutionSessionProps) {
  const router = useRouter();
  const [pendingExercise, setPendingExercise] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleLogSet(exercise: WorkoutPlan["exercises"][number]) {
    if (pendingExercise) {
      return;
    }

    setError("");
    setPendingExercise(exercise.exerciseName);

    try {
      const loggedSets = getExerciseSets(
        session.workout_sets,
        exercise.exerciseName
      );

      const nextSetNumber = loggedSets.length + 1;

      await addWorkoutSet({
        session_id: session.id,
        exercise_name: exercise.exerciseName,
        exercise_order: plan.exercises.findIndex(
          (item) => item.exerciseName === exercise.exerciseName
        ) + 1,
        set_number: nextSetNumber,
        weight: exercise.weight,
        reps: exercise.reps,
      });

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save the workout set."
      );
    } finally {
      setPendingExercise(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Workout session
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {new Date(session.date).toLocaleDateString(
              undefined,
              {
                weekday: "short",
                month: "short",
                day: "numeric",
              }
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log each set as you complete it. The database remains the source of truth.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {plan.exercises.map((exercise) => {
            const loggedSets = getExerciseSets(
              session.workout_sets,
              exercise.exerciseName
            );
            const isPending =
              pendingExercise === exercise.exerciseName;

            return (
              <article
                key={exercise.exerciseName}
                className="rounded-xl border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {exercise.exerciseName}
                    </h2>

                    <p className="mt-2 text-2xl font-bold">
                      {exercise.weight} kg
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                    {exercise.decision}
                  </span>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Last trained {exercise.daysSinceLastTrained} day
                  {exercise.daysSinceLastTrained === 1 ? "" : "s"} ago.
                </p>

                {exercise.reasonCode && (
                  <div className="mt-4 rounded-md border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Why this recommendation
                    </p>
                    <p className="mt-1 text-sm">
                      {exercise.reasoning ??
                        "Recommendation generated from your workout history."}
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Logged sets ({loggedSets.length}/{exercise.sets})
                    </p>

                    <button
                      type="button"
                      onClick={() => handleLogSet(exercise)}
                      disabled={isPending}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Saving..." : "Log set"}
                    </button>
                  </div>

                  {loggedSets.length > 0 ? (
                    <ul className="space-y-2">
                      {loggedSets.map((set) => (
                        <li
                          key={set.id}
                          className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          <span>
                            Set {set.set_number}: {set.weight} kg × {set.reps}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            Saved
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-md border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
                      No sets logged yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
