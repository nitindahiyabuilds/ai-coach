import { getHealthMetrics } from "@/lib/health/actions";

export default async function Home() {
  const metrics = await getHealthMetrics();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">AI OS</h1>

      <div className="rounded-lg border p-4">
        <p><strong>BMR:</strong> {Math.round(metrics.bmr)} kcal</p>
        <p><strong>TDEE:</strong> {Math.round(metrics.tdee)} kcal</p>
        <p><strong>Calories:</strong> {Math.round(metrics.calories)} kcal</p>
        <p><strong>Protein:</strong> {Math.round(metrics.protein)} g</p>
        <p><strong>Water:</strong> {Math.round(metrics.water)} ml</p>
      </div>
    </main>
  );
}