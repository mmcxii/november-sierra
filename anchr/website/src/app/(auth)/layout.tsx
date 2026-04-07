import { SiteLogo } from "@/components/marketing/site-logo";
import { MarketingThemeProvider } from "@/components/marketing/theme-provider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import * as React from "react";

export type AuthLayoutProps = React.PropsWithChildren;

const AuthLayout: React.FC<AuthLayoutProps> = async (props) => {
  const { children } = props;

  const { userId } = await auth();

  if (userId != null) {
    redirect("/dashboard");
  }

  return (
    <MarketingThemeProvider>
      <div className="relative flex min-h-dvh flex-col bg-(--m-page-bg) text-[rgb(var(--m-text))] transition-colors duration-300 lg:flex-row">
        {/* Grain overlay — full page */}
        <div className="m-grain-bg m-grain-opacity pointer-events-none fixed inset-0 z-50" />
        {/* Wave background — full page */}
        <div className="pointer-events-none fixed inset-0">
          <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="20" id="authWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
                <path
                  className="[stroke-(--m-wave-stroke)]"
                  d="M-70,10 C-52.5,3 -17.5,17 0,10 C17.5,3 52.5,17 70,10 C87.5,3 122.5,17 140,10 C157.5,3 192.5,17 210,10 C227.5,3 262.5,17 280,10 C297.5,3 332.5,17 350,10"
                  fill="none"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect fill="url(#authWaves)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Left panel — logo */}
        <div className="relative z-10 flex items-center justify-center max-lg:py-12 lg:flex-2">
          <SiteLogo className="max-lg:hidden" size="4xl" />
          <SiteLogo className="lg:hidden" size="sm" />
        </div>

        {/* Right panel — form */}
        <div className="relative z-10 flex flex-1 lg:flex-1">{children}</div>
      </div>
    </MarketingThemeProvider>
  );
};

export default AuthLayout;
