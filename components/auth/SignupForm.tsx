"use client";

import { useActionState } from "react";
import { signup } from "@/app/signup/actions";

const initialState = {
  success: false,
  message: "",
};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signup,
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <h1 className="text-3xl font-bold">Create Account</h1>

      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="rounded border p-3"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        className="rounded border p-3"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black p-3 text-white"
      >
        {pending ? "Creating..." : "Create Account"}
      </button>

      {state.message && (
        <p
          className={
            state.success ? "text-green-600" : "text-red-600"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}