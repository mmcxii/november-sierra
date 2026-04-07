export type Step = "done" | "name";

export type State = {
  copied: boolean;
  dismissAttempts: number;
  error: null | string;
  isCreating: boolean;
  name: string;
  rawKey: string;
  revokedWarning: boolean;
  showDismissWarning: boolean;
  step: Step;
};

export type Action = { type: "close" } | { type: "dismiss" } | { type: "open" };

export function createInitialState(): State {
  return {
    copied: false,
    dismissAttempts: 0,
    error: null,
    isCreating: false,
    name: "",
    rawKey: "",
    revokedWarning: false,
    showDismissWarning: false,
    step: "name",
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "close":
      return createInitialState();
    case "dismiss": {
      if (state.step !== "done") {
        return state;
      }
      const attempts = state.dismissAttempts + 1;
      return { ...state, dismissAttempts: attempts, showDismissWarning: attempts >= 2 };
    }
    case "open":
      // Do NOT reset if already in use — prevents remount from wiping state
      return state;
    default:
      return state;
  }
}
