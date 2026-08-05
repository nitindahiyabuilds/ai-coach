"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signUp,
    initialState
  );

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border p-6"
    >
      <h1 className="text-2xl font-bold">Create Account</h1>

      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="rounded-md border p-3"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        minLength={8}
        className="rounded-md border p-3"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black p-3 text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Account"}
      </button>

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}