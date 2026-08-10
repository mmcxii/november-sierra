import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { SITE_URL } from "@/lib/constants";
import { initTranslations } from "@/lib/i18n/server";
import { TranslationsProvider } from "@/lib/i18n/translations-provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Team SeventyFive",
  },
  applicationName: "Team SeventyFive",
  description: "The quiet practice of showing up.",
  icons: {
    apple: [{ sizes: "192x192", type: "image/png", url: "/icons/icon-192.png" }],
    icon: [
      { type: "image/svg+xml", url: "/icons/icon.svg" },
      { sizes: "192x192", type: "image/png", url: "/icons/icon-192.png" },
    ],
  },
  metadataBase: new URL(APP_URL),
  title: "Team SeventyFive",
};

export const viewport: Viewport = {
  themeColor: [
    { color: "#f4f0e8", media: "(prefers-color-scheme: light)" },
    { color: "#141311", media: "(prefers-color-scheme: dark)" },
  ],
};

export type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = async (props) => {
  const { children } = props;
  const { resources } = await initTranslations("en-US");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/icons/icon.svg" rel="icon" type="image/svg+xml" />
        <link href="/icons/icon-192.png" rel="apple-touch-icon" sizes="192x192" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeScript />
        <TranslationsProvider locale="en-US" resources={resources}>
          {children}
        </TranslationsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
