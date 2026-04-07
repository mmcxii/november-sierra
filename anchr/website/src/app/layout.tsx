import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { DashboardThemeProvider } from "@/components/dashboard/theme-provider";
import { PosthogProvider } from "@/components/posthog";
import { Toaster } from "@/components/ui/sonner";
import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import { TranslationsProvider } from "@/lib/i18n/translations-provider";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  applicationName: "Anchr",
  description:
    "Anchr is a link-in-bio tool that brings your scattered profiles, payment handles, and important links into one beautiful, blazing-fast page you actually own.",
  metadataBase: new URL(envSchema.NEXT_PUBLIC_APP_URL),
  openGraph: {
    locale: "en_US",
    siteName: "Anchr",
    type: "website",
    url: "/",
  },
  title: {
    default: "Anchr — Your Harbor for Every Connection",
    template: "%s | Anchr",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = async (props) => {
  const { children } = props;

  //* Variables
  const { resources } = await initTranslations("en-US");

  return (
    <ClerkProvider>
      <TranslationsProvider locale="en" resources={resources}>
        <PosthogProvider>
          <html lang="en" suppressHydrationWarning>
            <body className={cn(GeistSans.variable, GeistMono.variable, "antialiased")}>
              <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />
              <DashboardThemeProvider>
                {children}
                <Toaster />
              </DashboardThemeProvider>
            </body>
            <Analytics />
            <SpeedInsights />
          </html>
        </PosthogProvider>
      </TranslationsProvider>
    </ClerkProvider>
  );
};

export default RootLayout;
