"use client";

import { useDashboardTheme } from "@/components/dashboard/theme-provider/context";
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster: React.FC<ToasterProps> = (props) => {
  const { isDark } = useDashboardTheme();

  return (
    <Sonner
      className="toaster toaster-theme group"
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      theme={isDark ? "dark" : "light"}
      {...props}
    />
  );
};
