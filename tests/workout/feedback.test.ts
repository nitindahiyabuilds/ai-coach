import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { updateWorkoutFeedback } from "@/lib/workout/actions";
import type { PostWorkoutFeedback } from "@/lib/contracts/workout-session";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function createQuery(): MockQuery {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
  };
}

describe("post-workout feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      updateWorkoutFeedback("session-123", "good")
    ).rejects.toThrow("Unauthorized");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid feedback values", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    await expect(
      updateWorkoutFeedback(
        "session-123",
        "excellent" as PostWorkoutFeedback
      )
    ).rejects.toThrow("Invalid post-workout feedback");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects feedback when the workout session does not exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutFeedback("session-123", "good")
    ).rejects.toThrow("Workout session not found");

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("rejects feedback for an incomplete workout", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: null,
      },
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutFeedback("session-123", "hard")
    ).rejects.toThrow(
      "Workout session must be completed before feedback"
    );

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(sessionQuery.update).not.toHaveBeenCalled();
  });

  it("persists feedback for a completed workout", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-10-09T07:00:00.000Z",
      },
      error: null,
    });

    const updateQuery = createQuery();

    const updatedSession = {
      id: "session-123",
      user_id: "user-1",
      completed_at: "2026-10-09T07:00:00.000Z",
      post_workout_feedback: "hard",
      workout_sets: [],
    };

    updateQuery.single.mockResolvedValue({
      data: updatedSession,
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(updateQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const result = await updateWorkoutFeedback(
      "session-123",
      "hard"
    );

    expect(result).toEqual(updatedSession);

    expect(fromMock).toHaveBeenCalledTimes(2);

    expect(updateQuery.update).toHaveBeenCalledWith({
      post_workout_feedback: "hard",
    });

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(updateQuery.select).toHaveBeenCalledWith(
      expect.stringContaining("post_workout_feedback")
    );
  });

  it("rejects feedback when the database update fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-10-09T07:00:00.000Z",
      },
      error: null,
    });

    const updateQuery = createQuery();

    updateQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Database update failed" },
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(updateQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutFeedback("session-123", "brutal")
    ).rejects.toThrow("Unable to save workout feedback");
  });
});