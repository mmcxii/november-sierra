import { describe, expect, it } from "vitest";
import { createInitialState, reducer } from "./use-create-key-dialog";

describe("create-key-dialog reducer", () => {
  it("should NOT reset state when dialog is already open", () => {
    //* Arrange — simulate dialog in "done" step with a raw key visible
    const state = {
      ...createInitialState(),
      rawKey: "anc_k_test123",
      step: "done" as const,
    };

    //* Act — "open" event fires while dialog is already open (e.g., remount)
    const next = reducer(state, { type: "open" });

    //* Assert — state should be preserved, not reset
    expect(next.step).toBe("done");
    expect(next.rawKey).toBe("anc_k_test123");
  });

  it("should reset all state when dialog closes", () => {
    //* Arrange — dialog is in "done" step with state populated
    const state: ReturnType<typeof createInitialState> = {
      copied: true,
      dismissAttempts: 2,
      error: "some error",
      isCreating: false,
      name: "my-key",
      rawKey: "anc_k_test123",
      revokedWarning: true,
      showDismissWarning: true,
      step: "done",
    };

    //* Act
    const next = reducer(state, { type: "close" });

    //* Assert — everything back to initial
    expect(next).toEqual(createInitialState());
  });

  it("should show dismiss warning after 2 failed dismiss attempts in done step", () => {
    //* Arrange — dialog is in "done" step
    const state = {
      ...createInitialState(),
      rawKey: "anc_k_test123",
      step: "done" as const,
    };

    //* Act — two dismiss attempts
    const after1 = reducer(state, { type: "dismiss" });
    const after2 = reducer(after1, { type: "dismiss" });

    //* Assert
    expect(after1.dismissAttempts).toBe(1);
    expect(after1.showDismissWarning).toBe(false);
    expect(after2.dismissAttempts).toBe(2);
    expect(after2.showDismissWarning).toBe(true);
  });

  it("should not count dismiss attempts during name step", () => {
    //* Arrange — dialog is in "name" step
    const state = createInitialState();

    //* Act
    const next = reducer(state, { type: "dismiss" });

    //* Assert — dismiss is ignored in "name" step
    expect(next.dismissAttempts).toBe(0);
  });
});
