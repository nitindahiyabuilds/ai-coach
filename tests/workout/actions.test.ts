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
  deleteWorkoutSet,
  getWorkoutSession,
  getWorkoutSessions,
  updateWorkoutSet,
} from "@/lib/workout/actions";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function createQuery(): MockQuery {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
}

describe("workout session actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
        felt: "moderate",
      })
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

  it("persists a workout set through the authenticated write path", async () => {
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
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
        felt: "moderate",
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

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "session-123",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
        felt: "moderate",
      })
    );
  });

  it("rejects adding a set to a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        completed_at: "2026-09-21T14:00:00.000Z",
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
      })
    ).rejects.toThrow("Workout session is already completed");

    expect(sessionQuery.insert).not.toHaveBeenCalled();
  });

  it("rejects invalid workout set input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    await expect(
      addWorkoutSet({
        session_id: "session-123",
        exercise_name: "   ",
        exercise_order: 1,
        set_number: 1,
        weight: 80,
        reps: 8,
      })
    ).rejects.toThrow("Exercise name is required");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("updates an active workout set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const workoutSetQuery = createQuery();

    workoutSetQuery.single.mockResolvedValue({
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
        set_number: 2,
        weight: 85,
        reps: 6,
        felt: "hard",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(workoutSetQuery)
      .mockReturnValueOnce(sessionQuery)
      .mockReturnValueOnce(updateQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const updatedSet = await updateWorkoutSet({
      set_id: "set-1",
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 2,
      weight: 85,
      reps: 6,
      felt: "hard",
    });

    expect(updatedSet).toMatchObject({
      id: "set-1",
      weight: 85,
      reps: 6,
      felt: "hard",
    });

    expect(updateQuery.update).toHaveBeenCalledWith({
      exercise_name: "Bench Press",
      exercise_order: 1,
      set_number: 2,
      weight: 85,
      reps: 6,
      felt: "hard",
    });

    expect(updateQuery.eq).toHaveBeenCalledWith(
      "id",
      "set-1"
    );
  });

  it("rejects updating a workout set from a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const workoutSetQuery = createQuery();

    workoutSetQuery.single.mockResolvedValue({
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
        completed_at: "2026-09-21T14:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(workoutSetQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      updateWorkoutSet({
        set_id: "set-1",
        exercise_name: "Bench Press",
        exercise_order: 1,
        set_number: 2,
        weight: 85,
        reps: 6,
      })
    ).rejects.toThrow("Workout session is already completed");

    expect(sessionQuery.update).not.toHaveBeenCalled();
  });

  it("deletes an active workout set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const workoutSetQuery = createQuery();

    workoutSetQuery.single.mockResolvedValue({
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
      .mockReturnValueOnce(workoutSetQuery)
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
      "set-1"
    );
  });

  it("rejects deleting a workout set from a completed session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const workoutSetQuery = createQuery();

    workoutSetQuery.single.mockResolvedValue({
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
        completed_at: "2026-09-21T14:00:00.000Z",
      },
      error: null,
    });

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(workoutSetQuery)
      .mockReturnValueOnce(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      deleteWorkoutSet("set-1")
    ).rejects.toThrow("Workout session is already completed");
  });

  it("rejects completion for an unauthenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      completeWorkoutSession("session-123")
    ).rejects.toThrow("Unauthorized");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects completion when the workout session does not belong to the user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: null,
      error: new Error("not found"),
    });

    const fromMock = vi.fn().mockReturnValue(sessionQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await expect(
      completeWorkoutSession("session-123")
    ).rejects.toThrow("Workout session not found");
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

  it("rejects workout history for an unauthenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      getWorkoutSessions()
    ).rejects.toThrow("Unauthorized");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns workout history ordered by date and created time", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const historyQuery = createQuery();

    historyQuery.order
      .mockReturnValueOnce(historyQuery)
      .mockResolvedValueOnce({
        data: [
          {
            id: "session-2",
            user_id: "user-1",
            date: "2026-09-03",
            workout_sets: [],
          },
          {
            id: "session-1",
            user_id: "user-1",
            date: "2026-09-01",
            workout_sets: [],
          },
        ],
        error: null,
      });

    const fromMock = vi.fn().mockReturnValue(historyQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const history = await getWorkoutSessions();

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe("session-2");
    expect(history[1].id).toBe("session-1");

    expect(historyQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );

    expect(historyQuery.order).toHaveBeenNthCalledWith(
      1,
      "date",
      { ascending: false }
    );

    expect(historyQuery.order).toHaveBeenNthCalledWith(
      2,
      "created_at",
      { ascending: false }
    );
  });

  it("applies date filters to workout history", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const historyQuery = createQuery();

    historyQuery.order
      .mockReturnValueOnce(historyQuery)
      .mockReturnValueOnce(historyQuery);

    historyQuery.range.mockResolvedValue({
      data: [],
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(historyQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    await getWorkoutSessions({
      from: "2026-09-01",
      to: "2026-09-30",
      limit: 20,
      offset: 0,
    });

    expect(historyQuery.gte).toHaveBeenCalledWith(
      "date",
      "2026-09-01"
    );

    expect(historyQuery.lte).toHaveBeenCalledWith(
      "date",
      "2026-09-30"
    );
  });

  it("applies pagination to workout history", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const historyQuery = createQuery();

    historyQuery.order
      .mockReturnValueOnce(historyQuery)
      .mockReturnValueOnce(historyQuery);

    historyQuery.range.mockResolvedValue({
      data: [
        {
          id: "session-3",
          user_id: "user-1",
          date: "2026-09-03",
          workout_sets: [],
        },
      ],
      error: null,
    });

    const fromMock = vi.fn().mockReturnValue(historyQuery);

    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
    } as never);

    const history = await getWorkoutSessions({
      limit: 10,
      offset: 20,
    });

    expect(historyQuery.range).toHaveBeenCalledWith(
      20,
      29
    );

    expect(history).toHaveLength(1);
  });

  it("rejects an invalid date range", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    await expect(
      getWorkoutSessions({
        from: "2026-09-30",
        to: "2026-09-01",
      })
    ).rejects.toThrow("From date cannot be after to date");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination values", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    await expect(
      getWorkoutSessions({
        limit: 101,
      })
    ).rejects.toThrow("Limit must be an integer between 1 and 100");

    await expect(
      getWorkoutSessions({
        offset: 10,
      })
    ).rejects.toThrow("Offset requires a limit");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid date values", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    await expect(
      getWorkoutSessions({
        from: "not-a-date",
      })
    ).rejects.toThrow("Invalid from date");

    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns a single workout session with explicit fields and sets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
    } as never);

    const sessionQuery = createQuery();

    sessionQuery.single.mockResolvedValue({
      data: {
        id: "session-123",
        user_id: "user-1",
        date: "2026-09-01",
        started_at: "2026-09-01T06:00:00.000Z",
        completed_at: "2026-09-01T07:00:00.000Z",
        notes: "Good session",
        created_at: "2026-09-01T05:55:00.000Z",
        workout_sets: [],
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
      date: "2026-09-01",
      notes: "Good session",
      workout_sets: [],
    });

    expect(sessionQuery.select).toHaveBeenCalledWith(
      expect.stringContaining("workout_sets")
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "id",
      "session-123"
    );

    expect(sessionQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-1"
    );
  });
});