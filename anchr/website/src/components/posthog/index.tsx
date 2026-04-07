"use client";

import { posthogClient } from "@/lib/posthog";
import { PostHogProvider as PostHogProviderBase } from "posthog-js/react";
import * as React from "react";
import { PageViewTracker } from "./page-view-tracker";

export type PosthogProviderProps = React.PropsWithChildren;

export const PosthogProvider: React.FC<PosthogProviderProps> = (props) => {
  const { children } = props;

  if (!posthogClient) {
    return <>{children}</>;
  }

  return (
    <PostHogProviderBase client={posthogClient}>
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
      {children}
    </PostHogProviderBase>
  );
};
