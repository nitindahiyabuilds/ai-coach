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
});
