"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInWithPassword,
  type AuthState,
} from "@/lib/auth/actions";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState
  );

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border p-6"
    >
      <h1 className="text-2xl font-bold">Sign In</h1>

      <input
        type="email"
        name="email"
        placeholder="Email"
        autoComplete="email"
        required
        className="rounded-md border p-3"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className="rounded-md border p-3"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black p-3 text-white disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>

      {state.message && (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <p className="text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
