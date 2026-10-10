"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addWorkoutSet,
  completeWorkoutSession,
  updateWorkoutFeedback,
} from "@/lib/workout/actions";
import type { WorkoutPlan } from "@/lib/contracts/workout";
import type {
  WorkoutSession,
  WorkoutSet,
} from "@/lib/workout/workout";
import WorkoutEmptyState from "./WorkoutEmptyState";

type WorkoutExecutionSessionProps = {
  session: WorkoutSession;
  plan: WorkoutPlan;
};

type EffortLevel = "easy" | "moderate" | "hard";

type PostWorkoutFeedback =
  | "easy"
  | "smooth"
  | "good"
  | "hard"
  | "brutal";

const POST_WORKOUT_FEEDBACK_OPTIONS: Array<
  readonly [PostWorkoutFeedback, string]
> = [
  ["easy", "Easy"],
  ["smooth", "Smooth"],
  ["good", "Good"],
  ["hard", "Hard"],
  ["brutal", "Brutal"],
];

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
  const [pendingExercise, setPendingExercise] =
    useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [error, setError] = useState("");
  const [weightInputs, setWeightInputs] = useState<
    Record<string, string>
  >({});
  const [repsInputs, setRepsInputs] = useState<
    Record<string, string>
  >({});
  const [feltInputs, setFeltInputs] = useState<
    Record<string, EffortLevel | "">
  >({});

  const isCompleted = session.completed_at !== null;

  function getWeightInput(
    exerciseName: string,
    prescribedWeight: number
  ) {
    return weightInputs[exerciseName] ?? String(prescribedWeight);
  }

  function getRepsInput(
    exerciseName: string,
    prescribedReps: number
  ) {
    return repsInputs[exerciseName] ?? String(prescribedReps);
  }

  const exerciseProgress = plan.exercises.map((exercise) => {
    const loggedSets = getExerciseSets(
      session.workout_sets,
      exercise.exerciseName
    );

    return {
      exercise,
      loggedSets,
      completed: loggedSets.length >= exercise.sets,
    };
  });

  const allSetsLogged =
    plan.exercises.length > 0 &&
    exerciseProgress.every((item) => item.completed);

  const totalRequiredSets = plan.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0
  );

  const totalLoggedSets = exerciseProgress.reduce(
    (total, item) => total + item.loggedSets.length,
    0
  );

  async function handleLogSet(
    exercise: WorkoutPlan["exercises"][number]
  ) {
    if (pendingExercise || isCompleting || isCompleted) {
      return;
    }

    const loggedSets = getExerciseSets(
      session.workout_sets,
      exercise.exerciseName
    );

    if (loggedSets.length >= exercise.sets) {
      return;
    }

    const weight = Number(
      getWeightInput(exercise.exerciseName, exercise.weight)
    );
    const reps = Number(
      getRepsInput(exercise.exerciseName, exercise.reps)
    );

    if (!Number.isFinite(weight) || weight < 0) {
      setError(
        `${exercise.exerciseName}: enter a valid weight.`
      );
      return;
    }

    if (!Number.isInteger(reps) || reps < 1) {
      setError(
        `${exercise.exerciseName}: enter a valid number of reps.`
      );
      return;
    }

    setError("");
    setPendingExercise(exercise.exerciseName);

    try {
      const nextSetNumber = loggedSets.length + 1;
      const felt = feltInputs[exercise.exerciseName];

      await addWorkoutSet({
        session_id: session.id,
        exercise_name: exercise.exerciseName,
        exercise_order:
          plan.exercises.findIndex(
            (item) =>
              item.exerciseName === exercise.exerciseName
          ) + 1,
        set_number: nextSetNumber,
        weight,
        reps,
        felt: felt || null,
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

  async function handleCompleteWorkout() {
    if (
      isCompleting ||
      isCompleted ||
      !allSetsLogged
    ) {
      return;
    }

    setError("");
    setIsCompleting(true);

    try {
      await completeWorkoutSession(session.id);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete the workout."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleFeedback(
    feedback: PostWorkoutFeedback
  ) {
    if (
      isSavingFeedback ||
      !isCompleted ||
      session.post_workout_feedback
    ) {
      return;
    }

    setError("");
    setIsSavingFeedback(true);

    try {
      await updateWorkoutFeedback(session.id, feedback);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save workout feedback."
      );
    } finally {
      setIsSavingFeedback(false);
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
            {isCompleted
              ? "This workout has been completed and is now part of your training history."
              : "Log each set with what you actually performed. The database remains the source of truth."}
          </p>
        </div>

        {isCompleted && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-5">
            <p className="text-lg font-semibold">
              Workout completed
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Your completed workout and actual performance
              are now available for future workout analysis.
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="rounded-xl border bg-background p-5">
            <p className="text-lg font-semibold">
              How did the workout feel?
            </p>

            {session.post_workout_feedback ? (
              <p className="mt-2 text-sm text-muted-foreground">
                You rated this workout as{" "}
                <span className="font-medium capitalize text-foreground">
                  {session.post_workout_feedback}
                </span>
                .
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your feedback helps the coach understand how this workout felt.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {POST_WORKOUT_FEEDBACK_OPTIONS.map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleFeedback(value)}
                        disabled={isSavingFeedback}
                        className="rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {plan.exercises.length === 0 ? (
          <WorkoutEmptyState />
        ) : (
          <>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    Workout progress
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {totalLoggedSets} / {totalRequiredSets}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    sets logged
                  </p>
                </div>

                {allSetsLogged && !isCompleted && (
                  <span className="rounded-full border px-3 py-1 text-xs font-medium">
                    Ready to complete
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {exerciseProgress.map(
                ({
                  exercise,
                  loggedSets,
                  completed,
                }) => {
                  const isPending =
                    pendingExercise ===
                    exercise.exerciseName;

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

                          <p className="mt-2 text-sm text-muted-foreground">
                            Prescribed
                          </p>

                          <p className="text-2xl font-bold">
                            {exercise.weight} kg ×{" "}
                            {exercise.reps} reps
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {exercise.sets} sets
                          </p>
                        </div>

                        <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                          {exercise.decision}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Last trained{" "}
                        {exercise.daysSinceLastTrained} day
                        {exercise.daysSinceLastTrained === 1
                          ? ""
                          : "s"}{" "}
                        ago.
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
                            Logged sets ({loggedSets.length}/
                            {exercise.sets})
                          </p>

                          {completed && (
                            <span className="text-sm font-medium text-muted-foreground">
                              All sets logged
                            </span>
                          )}
                        </div>

                        {!completed &&
                          !isCompleted && (
                            <div className="rounded-lg border bg-background p-3">
                              <p className="text-sm font-medium">
                                Set {loggedSets.length + 1}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <label className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    Actual weight (kg)
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={getWeightInput(
                                      exercise.exerciseName,
                                      exercise.weight
                                    )}
                                    onChange={(event) =>
                                      setWeightInputs(
                                        (current) => ({
                                          ...current,
                                          [exercise.exerciseName]:
                                            event.target.value,
                                        })
                                      )
                                    }
                                    disabled={isPending}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  />
                                </label>

                                <label className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    Actual reps
                                  </span>

                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={getRepsInput(
                                      exercise.exerciseName,
                                      exercise.reps
                                    )}
                                    onChange={(event) =>
                                      setRepsInputs(
                                        (current) => ({
                                          ...current,
                                          [exercise.exerciseName]:
                                            event.target.value,
                                        })
                                      )
                                    }
                                    disabled={isPending}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  />
                                </label>

                                <label className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    Felt
                                  </span>

                                  <select
                                    value={
                                      feltInputs[
                                        exercise.exerciseName
                                      ] ?? ""
                                    }
                                    onChange={(event) =>
                                      setFeltInputs(
                                        (current) => ({
                                          ...current,
                                          [exercise.exerciseName]:
                                            event.target
                                              .value as
                                              | EffortLevel
                                              | "",
                                        })
                                      )
                                    }
                                    disabled={isPending}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="">
                                      Not recorded
                                    </option>
                                    <option value="easy">
                                      Easy
                                    </option>
                                    <option value="moderate">
                                      Moderate
                                    </option>
                                    <option value="hard">
                                      Hard
                                    </option>
                                  </select>
                                </label>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleLogSet(
                                    exercise
                                  )
                                }
                                disabled={isPending}
                                className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isPending
                                  ? "Saving..."
                                  : "Log set"}
                              </button>
                            </div>
                          )}

                        {loggedSets.length > 0 ? (
                          <ul className="space-y-2">
                            {loggedSets.map((set) => (
                              <li
                                key={set.id}
                                className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                              >
                                <div>
                                  <span>
                                    Set {set.set_number}:{" "}
                                    {set.weight} kg ×{" "}
                                    {set.reps}
                                  </span>

                                  {set.felt && (
                                    <span className="ml-2 text-xs capitalize text-muted-foreground">
                                      {set.felt}
                                    </span>
                                  )}
                                </div>

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
                }
              )}
            </div>

            {!isCompleted && (
              <div className="rounded-xl border bg-background p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      Finish workout
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {allSetsLogged
                        ? "All prescribed sets are logged. You can finish the workout."
                        : `Log all ${totalRequiredSets} prescribed sets before completing the workout.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteWorkout}
                    disabled={!allSetsLogged || isCompleting}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCompleting
                      ? "Completing..."
                      : "Complete Workout"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}