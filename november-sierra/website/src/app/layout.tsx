import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { initTranslations } from "@/lib/i18n/server";
import { TranslationsProvider } from "@/lib/i18n/translations-provider";

const SITE_URL = "https://novembersierra.dev";

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
  },
  description:
    "November Sierra builds products with intuitive interfaces designed for people and clean APIs designed for agents.",
  keywords: [
    "November Sierra",
    "software development",
    "Pacific Northwest",
    "link-in-bio",
    "Anchr",
    "developer tools",
    "AI agents",
    "MCP",
    "web applications",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description:
      "November Sierra builds products with intuitive interfaces designed for people and clean APIs designed for agents.",
    locale: "en_US",
    siteName: "November Sierra",
    title: "November Sierra — Thoughtful. Intentional. Software.",
    type: "website",
    url: SITE_URL,
  },
  title: "November Sierra — Thoughtful. Intentional. Software.",
  twitter: {
    card: "summary_large_image",
    description:
      "November Sierra builds products with intuitive interfaces designed for people and clean APIs designed for agents.",
    title: "November Sierra — Thoughtful. Intentional. Software.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  description:
    "November Sierra builds products with intuitive interfaces designed for people and clean APIs designed for agents.",
  foundingDate: "2025",
  name: "November Sierra",
  sameAs: ["https://github.com/mmcxii/november-sierra"],
  url: SITE_URL,
};

export type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = async (props) => {
  const { children } = props;
  const { resources } = await initTranslations("en-US");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      </head>
      <body>
        <ThemeScript />
        <TranslationsProvider locale="en-US" resources={resources}>
          {children}
        </TranslationsProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
