import { PushSubscriptionSync } from "@/components/push-subscription-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import * as React from "react";

export type AppChromeProps = React.PropsWithChildren<{
  reminderPushEnabled?: boolean;
  vapidPublicKey?: string;
}>;

export const AppChrome: React.FC<AppChromeProps> = (props) => {
  const { children, reminderPushEnabled = false, vapidPublicKey } = props;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <PushSubscriptionSync enabled={reminderPushEnabled} vapidPublicKey={vapidPublicKey} />
      <div className="flex shrink-0 justify-end px-5 pt-4 sm:px-6 md:pt-6">
        <ThemeToggle />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
};
