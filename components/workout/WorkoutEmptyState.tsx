import Link from "next/link";

type WorkoutEmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function WorkoutEmptyState({
  title = "No workout plan yet",
  description = "Complete a workout first so your coach can learn from your training history and build your next plan.",
  actionLabel = "Back to coach",
  actionHref = "/coach",
}: WorkoutEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      <Link
        href={actionHref}
        className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {actionLabel}
      </Link>
    </div>
  );
}