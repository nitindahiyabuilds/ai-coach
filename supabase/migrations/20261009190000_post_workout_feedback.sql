alter table public.workout_sessions
add column post_workout_feedback text;

alter table public.workout_sessions
add constraint workout_sessions_post_workout_feedback_check
check (
  post_workout_feedback is null
  or post_workout_feedback in ('easy', 'smooth', 'good', 'hard', 'brutal')
);