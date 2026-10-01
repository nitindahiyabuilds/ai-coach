"use client";

import type { WorkoutPlan } from "@/lib/contracts/workout";
import WorkoutEmptyState from "@/components/workout/WorkoutEmptyState";

type WorkoutPlanCardProps = {
  plan: WorkoutPlan;
  onStartWorkout?: () => void;
  startingWorkout?: boolean;
};

export default function WorkoutPlanCard({
  plan,
  onStartWorkout,
  startingWorkout = false,
}: WorkoutPlanCardProps) {
  if (!plan.exercises.length) {
    return (
      <WorkoutEmptyState
        title="Your workout plan is not ready yet"
        description="Complete a workout first so your coach can learn from your training history and build a history-based plan."
      />
    );
  }

  return (
    <div className="space-y-4 rounded-xl border bg-background p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Your Next Workout
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Based on your recent training history.
        </p>
      </div>

      {onStartWorkout && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onStartWorkout}
            disabled={startingWorkout}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {startingWorkout
              ? "Starting..."
              : "Start workout"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {plan.exercises.map((exercise) => (
          <div
            key={exercise.exerciseName}
            className="rounded-lg border bg-muted/30 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {exercise.exerciseName}
                </h3>

                <p className="mt-1 text-2xl font-bold">
                  {exercise.weight} kg
                </p>

                <p className="text-sm text-muted-foreground">
                  {exercise.sets} sets ×{" "}
                  {exercise.reps} reps
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Reason: {exercise.reasonCode}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  Last trained{" "}
                  {exercise.daysSinceLastTrained} day
                  {exercise.daysSinceLastTrained === 1
                    ? ""
                    : "s"}{" "}
                  ago.
                </p>
              </div>

              <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                {exercise.decision}
              </span>
            </div>

            {exercise.reasoning && (
              <div className="mt-4 rounded-md border bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Why
                </p>

                <p className="mt-1 text-sm">
                  {exercise.reasoning}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}