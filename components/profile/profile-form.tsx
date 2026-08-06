"use client";

import { useActionState } from "react";
import {
  createProfile,
  type ProfileState,
} from "@/lib/profile/actions";

const initialState: ProfileState = {
  success: false,
  message: "",
};

export default function ProfileForm() {
  const [state, formAction, pending] = useActionState(
    createProfile,
    initialState
  );

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border p-6"
    >
      <h1 className="text-3xl font-bold">
        Complete Your Profile
      </h1>

      <input
        name="full_name"
        placeholder="Full Name"
        required
        className="rounded-md border p-3"
      />

      <input
        name="age"
        type="number"
        placeholder="Age"
        required
        className="rounded-md border p-3"
      />

      <input
        name="height_cm"
        type="number"
        placeholder="Height (cm)"
        required
        className="rounded-md border p-3"
      />

      <input
        name="weight_kg"
        type="number"
        step="0.1"
        placeholder="Weight (kg)"
        required
        className="rounded-md border p-3"
      />

      <select
        name="sex"
        required
        className="rounded-md border p-3"
      >
        <option value="">Sex</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <input
        name="activity_level"
        placeholder="Activity Level"
        required
        className="rounded-md border p-3"
      />

      <input
        name="goal"
        placeholder="Goal"
        required
        className="rounded-md border p-3"
      />

      <input
        name="training_experience"
        placeholder="Training Experience"
        required
        className="rounded-md border p-3"
      />

      <input
        name="equipment"
        placeholder="Equipment"
        required
        className="rounded-md border p-3"
      />

      <input
        name="dietary_preference"
        placeholder="Dietary Preference"
        required
        className="rounded-md border p-3"
      />

      <input
        name="region"
        placeholder="Region"
        required
        className="rounded-md border p-3"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black p-3 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Profile"}
      </button>

      {state.message && (
        <p
          className={`text-sm ${
            state.success
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}