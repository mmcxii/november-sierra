import { CookieBanner } from "@/components/marketing/cookie-banner";
import { MarketingThemeProvider } from "@/components/marketing/theme-provider";
import { ThemeToggle } from "@/components/marketing/theme-toggle";

export type MarketingLayoutProps = React.PropsWithChildren;

const MarketingLayout: React.FC<MarketingLayoutProps> = (props) => {
  const { children } = props;

  return (
    <MarketingThemeProvider>
      <div className="relative flex min-h-dvh flex-col bg-(--m-page-bg) text-[rgb(var(--m-text))] transition-colors duration-300">
        {/* Grain overlay */}
        <div className="m-grain-bg m-grain-opacity pointer-events-none fixed inset-0 z-50" />
        {/* Wave background — fades out into the page */}
        <div className="m-wave-mask pointer-events-none absolute inset-x-0 top-0 h-[700px]">
          <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="20" id="bgWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
                <path
                  className="m-wave-stroke"
                  d="M-70,10 C-52.5,3 -17.5,17 0,10 C17.5,3 52.5,17 70,10 C87.5,3 122.5,17 140,10 C157.5,3 192.5,17 210,10 C227.5,3 262.5,17 280,10 C297.5,3 332.5,17 350,10"
                  fill="none"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect fill="url(#bgWaves)" height="100%" width="100%" />
          </svg>
        </div>

        {children}
        <CookieBanner />
        <ThemeToggle />
      </div>
    </MarketingThemeProvider>
  );
};

export default MarketingLayout;
