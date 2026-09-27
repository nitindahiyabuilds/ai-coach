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
  createWorkoutSession,
  updateWorkoutSet,
  deleteWorkoutSet,
  completeWorkoutSession,
  getWorkoutSession,
} from "@/lib/workout/actions";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function createQuery(): MockQuery {
  const query: MockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  return query;
}

describe("workout session actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      createWorkoutSession({
        date: "2026-09-01",
      }),
    ).rejects.toThrow("Unauthorized");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("reuses an active session instead of creating a duplicate on the same day", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.maybeSingle.mockResolvedValue({
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

    const session = await createWorkoutSession({
      date: "2026-09-01",
      started_at: "2026-09-01T06:00:00.000Z",
    });

    expect(session).toEqual({
      id: "session-123",
      completed_at: null,
    });

    expect(fromMock).toHaveBeenCalledWith("workout_sessions");

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1",
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "date",
      "2026-09-01",
    );

    expect(sessionQuery.is).toHaveBeenCalledWith(
      "completed_at",
      null,
    );

    expect(sessionQuery.insert).not.toHaveBeenCalled();
  });

  it("persists workout sets through the authenticated write path", async () => {
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
      "session-123",
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1",
    );

    expect(insertQuery.insert).toHaveBeenCalledWith({
      session_id: "session-123",
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 1,
      weight: 80,
      reps: 8,
      felt: "moderate",
    });
  });

  it("rejects adding a set to a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-09-01T07:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
      }),
    ).rejects.toThrow("Workout session is already completed");

    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid workout set input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const client = {
      from: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
      }),
    ).rejects.toThrow("Exercise name is required");

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 0,
        set_number: 1,
        weight: 80,
        reps: 8,
      }),
    ).rejects.toThrow("Exercise order must be a positive integer");

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 0,
        weight: 80,
        reps: 8,
      }),
    ).rejects.toThrow("Set number must be a positive integer");

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: -1,
        reps: 8,
      }),
    ).rejects.toThrow("Weight must be a non-negative number");

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 0,
      }),
    ).rejects.toThrow("Reps must be a positive integer");

    expect(client.from).not.toHaveBeenCalled();
  });

  it("updates a workout set in an active session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-123",
      },
      error: null,
    });

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
        id: "set-1",
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 85,
        reps: 8,
        felt: "hard",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(updateQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const updatedSet = await updateWorkoutSet({
      set_id: "set-1",
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 1,
      weight: 85,
      reps: 8,
      felt: "hard",
    });

    expect(updatedSet).toMatchObject({
      id: "set-1",
      session_id: "session-123",
      weight: 85,
      reps: 8,
      felt: "hard",
    });

    expect(updateQuery.update).toHaveBeenCalledWith({
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 1,
      weight: 85,
      reps: 8,
      felt: "hard",
    });

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "id",
      "set-1",
    );
  });

  it("rejects updating a set from a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-123",
      },
      error: null,
    });

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-09-01T07:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutSet({
        set_id: "set-1",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 85,
        reps: 8,
      }),
    ).rejects.toThrow("Workout session is already completed");
  });

  it("rejects updating a workout set that does not belong to the authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-owned-by-other-user",
      },
      error: null,
    });

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: null,
      error: {
        message: "No rows found",
      },
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutSet({
        set_id: "set-1",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 85,
        reps: 8,
      }),
    ).rejects.toThrow("Workout set not found");
  });

  it("deletes a workout set from an active session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-123",
      },
      error: null,
    });

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: null,
      },
      error: null,
    });

    const deleteQuery = createQuery();

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(deleteQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const result = await deleteWorkoutSet("set-1");

    expect(result).toEqual({
      success: true,
      id: "set-1",
    });

    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith(
      "id",
      "set-1",
    );
  });

  it("rejects deleting a workout set from a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-123",
      },
      error: null,
    });

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-09-01T07:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      deleteWorkoutSet("set-1"),
    ).rejects.toThrow("Workout session is already completed");
  });

  it("rejects deleting a workout set that does not belong to the authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const setQuery = createQuery();

    setQuery.single.mockResolvedValue({
      data: {
        id: "set-1",
        session_id: "session-owned-by-other-user",
      },
      error: null,
    });

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: null,
      error: {
        message: "No rows found",
      },
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(setQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      deleteWorkoutSet("set-1"),
    ).rejects.toThrow("Workout set not found");
  });

  it("completes an active workout session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single
      .mockResolvedValueOnce({
        data: {
          id: "session-123",
          completed_at: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "session-123",
          date: "2026-09-01",
          completed_at: "2026-09-01T07:00:00.000Z",
        },
        error: null,
      });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const result = await completeWorkoutSession("session-123");

    expect(result).toMatchObject({
      id: "session-123",
      date: "2026-09-01",
    });

    expect(sessionQuery.update).toHaveBeenCalledWith({
      completed_at: expect.any(String),
    });

    expect(sessionQuery.is).toHaveBeenCalledWith(
      "completed_at",
      null,
    );
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
      "session-123",
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1",
    );
  });
});