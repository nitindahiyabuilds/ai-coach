import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { getWorkoutSession } from "@/lib/workout/actions";
import { generateWorkoutPlan } from "@/lib/planning/workout-plan";
import { getWorkoutAnalysis } from "@/lib/workout/workout-service";
import WorkoutExecutionSession from "@/components/workout/WorkoutExecutionSession";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signup");
  }

  const { sessionId } = await params;

  const session = await getWorkoutSession(sessionId).catch(() => null);

  if (!session) {
    redirect("/coach");
  }

  const workoutAnalysis = await getWorkoutAnalysis();
  const plan = workoutAnalysis
    ? generateWorkoutPlan(workoutAnalysis)
    : { exercises: [] };

  return (
    <WorkoutExecutionSession
      session={session}
      plan={plan}
    />
  );
}
