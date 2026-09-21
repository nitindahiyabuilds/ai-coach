import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import {
  addWorkoutSet,
  completeWorkoutSession,
  createWorkoutSession,
  getWorkoutSession,
} from "@/lib/workout/actions";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function createQuery(): MockQuery {
  const query: MockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };

  return query;
}

describe("workout session actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses an active session instead of creating a duplicate on the same day", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();
    sessionQuery.single.mockResolvedValue({
      data: { id: "session-123" },
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);
    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const session = await createWorkoutSession({
      date: "2026-09-01",
      started_at: "2026-09-01T06:00:00.000Z",
    });

    expect(session).toEqual({ id: "session-123" });
    expect(fromMock).toHaveBeenCalledWith("workout_sessions");
    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );
    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "date",
      "2026-09-01"
    );
    expect(sessionQuery.is).toHaveBeenCalledWith(
      "completed_at",
      null
    );
    expect(sessionQuery.insert).not.toHaveBeenCalled();
  });

  it("persists workout sets through the authenticated write path", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();
    sessionQuery.single.mockResolvedValue({
      data: { id: "session-123" },
      error: null,
    });

    const insertQuery = createQuery();
    insertQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-123",
        exercise_name: "Bench Press",
        weight: 80,
        reps: 8,
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(insertQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const set = await addWorkoutSet({
      session_id: "session-123",
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 1,
      weight: 80,
      reps: 8,
      felt: "moderate",
    });

    expect(set).toMatchObject({
      id: "set-1",
      session_id: "session-123",
      exercise_name: "Bench Press",
      weight: 80,
      reps: 8,
    });

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(insertQuery.insert).toHaveBeenCalled();
  });

  it("returns the persisted workout session and sets for the authenticated owner", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();
    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        user_id: "user-1",
        date: "2026-09-01",
        workout_sets: [
          {
            id: "set-1",
            session_id: "session-123",
            exercise_name: "Bench Press",
            set_number: 1,
            weight: 80,
            reps: 8,
          },
        ],
      },
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const session = await getWorkoutSession("session-123");

    expect(session).toMatchObject({
      id: "session-123",
      user_id: "user-1",
      workout_sets: [
        expect.objectContaining({
          id: "set-1",
          exercise_name: "Bench Press",
        }),
      ],
    });

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );
  });

  it("rejects completion when the user is unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      completeWorkoutSession("session-123")
    ).rejects.toThrow("Unauthorized");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects completion when the workout session does not exist or is not owned by the user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: null,
      error: {
        message: "No rows found",
      },
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      completeWorkoutSession("session-123")
    ).rejects.toThrow("Workout session not found");

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(sessionQuery.update).not.toHaveBeenCalled();
  });

  it("completes an active workout session", async () => {
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

    const updateQuery = createQuery();

    updateQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        user_id: "user-1",
        completed_at: "2026-09-21T14:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(updateQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const completedSession =
      await completeWorkoutSession("session-123");

    expect(completedSession).toMatchObject({
      id: "session-123",
      user_id: "user-1",
      completed_at: "2026-09-21T14:00:00.000Z",
    });

    expect(sessionQuery.select).toHaveBeenCalledWith(
      "id, completed_at"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: expect.any(String),
      })
    );

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(updateQuery.is).toHaveBeenCalledWith(
      "completed_at",
      null
    );
  });

  it("rejects completion when the workout session is already completed", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-09-20T14:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      completeWorkoutSession("session-123")
    ).rejects.toThrow("Workout session already completed");

    expect(sessionQuery.select).toHaveBeenCalledWith(
      "id, completed_at"
    );

    expect(sessionQuery.update).not.toHaveBeenCalled();
  });
});
