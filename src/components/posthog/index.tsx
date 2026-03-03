"use client";

import { posthogClient } from "@/lib/posthog";
import { PostHogProvider as PostHogProviderBase } from "posthog-js/react";
import { Suspense } from "react";
import { PageViewTracker } from "./page-view-tracker";

export type PosthogProviderProps = React.PropsWithChildren;

export const PosthogProvider: React.FC<PosthogProviderProps> = (props) => {
  const { children } = props;

  if (!posthogClient) {
    return <>{children}</>;
  }

  return (
    <PostHogProviderBase client={posthogClient}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PostHogProviderBase>
  );
};
