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

export type ExerciseAnalysis = {
  exercise_name: string;

  latest: {
    sets: WorkoutSet[];
    total_volume: number;
    top_set: WorkoutSet | null;
  };

  previous: {
    sets: WorkoutSet[];
    total_volume: number;
    top_set: WorkoutSet | null;
  } | null;

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

function calculateVolume(sets: WorkoutSet[]) {
  return sets.reduce((total, set) => {
    return total + set.weight * set.reps;
  }, 0);
}

function getTopSet(sets: WorkoutSet[]) {
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

function groupSetsByExercise(sets: WorkoutSet[]) {
  const groups = new Map<string, WorkoutSet[]>();

  for (const set of sets) {
    const existing = groups.get(set.exercise_name) ?? [];
    existing.push(set);
    groups.set(set.exercise_name, existing);
  }

  return groups;
}

function getExerciseNames(
  latestSets: WorkoutSet[],
  previousSets: WorkoutSet[]
) {
  return Array.from(
    new Set([
      ...latestSets.map((set) => set.exercise_name),
      ...previousSets.map((set) => set.exercise_name),
    ])
  );
}

function analyzeExercise(
  exerciseName: string,
  latestSets: WorkoutSet[],
  previousSets: WorkoutSet[]
): ExerciseAnalysis {
  const latest = latestSets.filter(
    (set) => set.exercise_name === exerciseName
  );

  const previous = previousSets.filter(
    (set) => set.exercise_name === exerciseName
  );

  const latestTopSet = getTopSet(latest);
  const previousTopSet = getTopSet(previous);

  return {
    exercise_name: exerciseName,

    latest: {
      sets: latest,
      total_volume: calculateVolume(latest),
      top_set: latestTopSet,
    },

    previous:
      previous.length > 0
        ? {
            sets: previous,
            total_volume: calculateVolume(previous),
            top_set: previousTopSet,
          }
        : null,

    changes: {
      top_weight:
        latestTopSet && previousTopSet
          ? latestTopSet.weight - previousTopSet.weight
          : null,

      top_reps:
        latestTopSet && previousTopSet
          ? latestTopSet.reps - previousTopSet.reps
          : null,

      total_volume:
        previous.length > 0
          ? calculateVolume(latest) - calculateVolume(previous)
          : null,
    },
  };
}

export function analyzeWorkoutHistory(
  sessions: WorkoutSession[]
): WorkoutAnalysis | null {
  if (sessions.length === 0) {
    return null;
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    return (
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
    );
  });

  const latestSession = sortedSessions[0];
  const previousSession = sortedSessions[1] ?? null;

  const latestSets = latestSession.workout_sets ?? [];
  const previousSets = previousSession?.workout_sets ?? [];

  const exerciseNames = getExerciseNames(
    latestSets,
    previousSets
  );

  const latestByExercise = groupSetsByExercise(latestSets);
  const previousByExercise = groupSetsByExercise(previousSets);

  const exercises = exerciseNames.map((exerciseName) => {
    return analyzeExercise(
      exerciseName,
      latestByExercise.get(exerciseName) ?? [],
      previousByExercise.get(exerciseName) ?? []
    );
  });

  return {
    latest_session: latestSession,
    previous_session: previousSession,
    exercises,
  };
}