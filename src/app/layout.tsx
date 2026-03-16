import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardThemeProvider } from "@/components/dashboard/theme-provider";
import { PosthogProvider } from "@/components/posthog";
import { Toaster } from "@/components/ui/sonner";
import { initTranslations } from "@/lib/i18n/server";
import { TranslationsProvider } from "@/lib/i18n/translations-provider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description: "A single harbor for all your links.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
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
          <html className="[color-scheme:dark]" data-theme="dark-depths" lang="en" suppressHydrationWarning>
            <body className={cn(geistSans.variable, geistMono.variable, "antialiased")}>
              <DashboardThemeProvider>
                {children}
                <Toaster />
              </DashboardThemeProvider>
            </body>
            <Analytics />
          </html>
        </PosthogProvider>
      </TranslationsProvider>
    </ClerkProvider>
  );
};

export default RootLayout;
