import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, redirectError } = vi.hoisted(() => {
  const redirectError = new Error("NEXT_REDIRECT");

  return {
    redirectError,
    redirectMock: vi.fn(() => {
      throw redirectError;
    }),
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import {
  signInWithPassword,
  type AuthState,
} from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

const initialState: AuthState = {
  success: false,
  message: "",
};

function createFormData(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid form data before creating the Supabase client", async () => {
    const result = await signInWithPassword(
      initialState,
      createFormData("not-an-email", "")
    );

    expect(result).toEqual({
      success: false,
      message: "Please enter a valid email address.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects an empty password for a valid email before creating the Supabase client", async () => {
    const result = await signInWithPassword(
      initialState,
      createFormData("user@example.com", "")
    );

    expect(result).toEqual({
      success: false,
      message: "Please enter your password.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns a safe message for invalid credentials", async () => {
    const signIn = vi.fn().mockResolvedValue({
      error: {
        code: "invalid_credentials",
        message: "Internal provider details",
      },
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithPassword: signIn },
    } as never);

    const result = await signInWithPassword(
      initialState,
      createFormData("user@example.com", "entered-password")
    );

    expect(result).toEqual({
      success: false,
      message: "Email or password is incorrect.",
    });
    expect(result.message).not.toContain("Internal provider details");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("does not expose unexpected Supabase error details", async () => {
    const signIn = vi.fn().mockResolvedValue({
      error: {
        code: "unexpected_error",
        message: "Sensitive internal provider details",
      },
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithPassword: signIn },
    } as never);

    const result = await signInWithPassword(
      initialState,
      createFormData("user@example.com", "entered-password")
    );

    expect(result).toEqual({
      success: false,
      message: "Unable to sign in right now. Please try again.",
    });
    expect(result.message).not.toContain(
      "Sensitive internal provider details"
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("uses the SSR client and propagates the successful redirect", async () => {
    const signIn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithPassword: signIn },
    } as never);

    await expect(
      signInWithPassword(
        initialState,
        createFormData("user@example.com", "entered-password")
      )
    ).rejects.toBe(redirectError);

    expect(createClient).toHaveBeenCalledOnce();
    expect(signIn).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "entered-password",
    });
    expect(redirectMock).toHaveBeenCalledWith("/coach");
  });
});
