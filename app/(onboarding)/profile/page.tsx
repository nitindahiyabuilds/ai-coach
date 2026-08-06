import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import ProfileForm from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signup");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
      <ProfileForm />
    </main>
  );
}