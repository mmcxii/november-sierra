"use client";

import { useTheme } from "@/hooks/use-theme";
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster: React.FC<ToasterProps> = (props) => {
  //* State
  const { mode, mounted } = useTheme();
  const [systemDark, setSystemDark] = React.useState(false);

  //* Variables
  let theme: "dark" | "light" = "light";
  if (mounted) {
    if (mode === "dark") {
      theme = "dark";
    } else if (mode === "light") {
      theme = "light";
    } else {
      theme = systemDark ? "dark" : "light";
    }
  }

  //* Effects
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setSystemDark(media.matches);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

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
      theme={theme}
      {...props}
    />
  );
};
