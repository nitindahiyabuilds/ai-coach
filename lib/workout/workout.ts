export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  felt: "easy" | "moderate" | "hard" | null;
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  date: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  workout_sets: WorkoutSet[];
};

export type ExerciseSessionAnalysis = {
  session_date: string;
  sets: WorkoutSet[];
  total_volume: number;
  top_set: WorkoutSet | null;
};

export type ExerciseAnalysis = {
  exercise_name: string;

  latest: ExerciseSessionAnalysis;

  previous: ExerciseSessionAnalysis | null;

  trend: ExerciseSessionAnalysis[];

  days_since_last_trained: number;

  changes: {
    top_weight: number | null;
    top_reps: number | null;
    total_volume: number | null;
  };
};

export type WorkoutAnalysis = {
  latest_session: WorkoutSession;
  previous_session: WorkoutSession | null;
  exercises: ExerciseAnalysis[];
};

function calculateVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => {
    return total + set.weight * set.reps;
  }, 0);
}

function getTopSet(sets: WorkoutSet[]): WorkoutSet | null {
  if (sets.length === 0) {
    return null;
  }

  return [...sets].sort((a, b) => {
    const weightDifference = b.weight - a.weight;

    if (weightDifference !== 0) {
      return weightDifference;
    }

    return b.reps - a.reps;
  })[0];
}

function getExerciseSessions(
  exerciseName: string,
  sessions: WorkoutSession[]
): ExerciseSessionAnalysis[] {
  const exerciseSessions: ExerciseSessionAnalysis[] = [];

  for (const session of sessions) {
    const sets = (session.workout_sets ?? []).filter(
      (set) => set.exercise_name === exerciseName
    );

    if (sets.length === 0) {
      continue;
    }

    exerciseSessions.push({
      session_date: session.date,
      sets,
      total_volume: calculateVolume(sets),
      top_set: getTopSet(sets),
    });
  }

  return exerciseSessions;
}

function calculateDaysSinceLastTrained(
  latestWorkoutDate: string,
  today = new Date()
): number {
  const latestDate = new Date(`${latestWorkoutDate}T00:00:00`);

  const currentDate = new Date(
    `${today.toISOString().slice(0, 10)}T00:00:00`
  );

  const differenceMs = currentDate.getTime() - latestDate.getTime();

  return Math.max(
    0,
    Math.floor(differenceMs / (1000 * 60 * 60 * 24))
  );
}

function getExerciseNames(sessions: WorkoutSession[]): string[] {
  return Array.from(
    new Set(
      sessions.flatMap((session) =>
        (session.workout_sets ?? []).map(
          (set) => set.exercise_name
        )
      )
    )
  );
}

export function analyzeWorkoutHistory(
  sessions: WorkoutSession[]
): WorkoutAnalysis | null {
  const completedSessions = sessions.filter(
    (session) => session.completed_at !== null
  );

  if (completedSessions.length === 0) {
    return null;
  }

  const sortedSessions = [...completedSessions].sort((a, b) => {
    return (
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
    );
  });

  const latestSession = sortedSessions[0];

  const previousSession =
    sortedSessions[1] ?? null;

  const exerciseNames =
    getExerciseNames(sortedSessions);

  const exercises: ExerciseAnalysis[] = [];

  for (const exerciseName of exerciseNames) {
    const exerciseSessions =
      getExerciseSessions(
        exerciseName,
        sortedSessions
      );

    const latest =
      exerciseSessions[0];

    if (!latest) {
      continue;
    }

    const previous: ExerciseSessionAnalysis | null =
      exerciseSessions[1] ?? null;

    const trend =
      exerciseSessions.slice(0, 3);

    const topWeightChange =
      latest.top_set && previous?.top_set
        ? latest.top_set.weight -
          previous.top_set.weight
        : null;

    const topRepsChange =
      latest.top_set && previous?.top_set
        ? latest.top_set.reps -
          previous.top_set.reps
        : null;

    const totalVolumeChange =
      previous
        ? latest.total_volume -
          previous.total_volume
        : null;

    const exerciseAnalysis: ExerciseAnalysis = {
      exercise_name: exerciseName,

      latest,

      previous,

      trend,

      days_since_last_trained:
        calculateDaysSinceLastTrained(
          latest.session_date
        ),

      changes: {
        top_weight: topWeightChange,
        top_reps: topRepsChange,
        total_volume: totalVolumeChange,
      },
    };

    exercises.push(exerciseAnalysis);
  }

  return {
    latest_session: latestSession,
    previous_session: previousSession,
    exercises,
  };
}