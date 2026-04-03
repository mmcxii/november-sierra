"use client";

import * as React from "react";
import { ApiKeyContext } from "../api-key-context";

export { useApiKey } from "../api-key-context";

export type ApiKeyProviderProps = React.PropsWithChildren;

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = (props) => {
  const { children } = props;

  const [apiKey, setApiKey] = React.useState("");

  const clearApiKey = React.useCallback(() => {
    setApiKey("");
  }, []);

  const value = React.useMemo(() => {
    return { apiKey, clearApiKey, setApiKey };
  }, [apiKey, clearApiKey]);

  return <ApiKeyContext value={value}>{children}</ApiKeyContext>;
};
