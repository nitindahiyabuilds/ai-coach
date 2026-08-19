"use client";

type WorkoutPlanExercise = {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  decision: "progress" | "hold" | "deload";
  reasonCode:
    | "progressed"
    | "maintain_after_decline"
    | "deload_after_repeated_decline"
    | "recent_return"
    | "insufficient_history";
  daysSinceLastTrained: number;
  reasoning?: string;
};

type WorkoutPlan = {
  exercises: WorkoutPlanExercise[];
};

type WorkoutPlanCardProps = {
  plan: WorkoutPlan;
};

export default function WorkoutPlanCard({
  plan,
}: WorkoutPlanCardProps) {
  if (!plan.exercises.length) {
    return null;
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
              </div>

              <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                {exercise.decision}
              </span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Last trained{" "}
              {exercise.daysSinceLastTrained}{" "}
              day
              {exercise.daysSinceLastTrained === 1
                ? ""
                : "s"}{" "}
              ago.
            </p>

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