"use client";

import * as React from "react";

export type ApiKeyContextValue = {
  apiKey: string;
  clearApiKey: () => void;
  setApiKey: (key: string) => void;
};

export const ApiKeyContext = React.createContext<ApiKeyContextValue>({
  apiKey: "",
  clearApiKey: () => {},
  setApiKey: () => {},
});

export function useApiKey(): ApiKeyContextValue {
  return React.useContext(ApiKeyContext);
}
