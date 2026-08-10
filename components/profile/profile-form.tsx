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
        className="rounded-md border border-gray-600 bg-black p-3 text-white placeholder:text-gray-400"
      />

      <input
        name="age"
        type="number"
        placeholder="Age"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white placeholder:text-gray-400"
      />

      <input
        name="height_cm"
        type="number"
        placeholder="Height (cm)"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white placeholder:text-gray-400"
      />

      <input
        name="weight_kg"
        type="number"
        step="0.1"
        placeholder="Weight (kg)"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white placeholder:text-gray-400"
      />

      <select
        name="sex"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Sex
        </option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <select
        name="activity_level"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Activity Level
        </option>
        <option value="light">Low</option>
        <option value="moderate">Moderate</option>
        <option value="active">High</option>
      </select>

      <select
        name="goal"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Goal
        </option>
        <option value="fat_loss">Lose Fat</option>
        <option value="maintenance">Maintain</option>
        <option value="muscle_gain">Build Muscle</option>
      </select>

      <select
        name="training_experience"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Training Experience
        </option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      <select
        name="equipment"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Equipment
        </option>
        <option value="gym">Gym</option>
        <option value="home">Home Equipment</option>
        <option value="bodyweight">Bodyweight Only</option>
      </select>

      <select
        name="dietary_preference"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
          style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Dietary Preference
        </option>
        <option value="vegetarian">Vegetarian</option>
        <option value="non_vegetarian">Non-Vegetarian</option>
        <option value="vegan">Vegan</option>
      </select>

      <select
        name="region"
        required
        className="rounded-md border border-gray-600 bg-black p-3 text-white"
        style={{ colorScheme: "dark" }}
        defaultValue=""
      >
        <option value="" disabled>
          Region
        </option>
        <option value="New Delhi">New Delhi</option>
        <option value="Mumbai">Mumbai</option>
        <option value="Bangalore">Bangalore</option>
        <option value="Hyderabad">Hyderabad</option>
        <option value="Chennai">Chennai</option>
        <option value="Kolkata">Kolkata</option>
        <option value="Other">Other</option>
      </select>

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