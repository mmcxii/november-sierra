import { Button } from "@/components/ui/button";
import { initTranslations } from "@/lib/i18n/server";
import { Anchor, Home } from "lucide-react";
import Link from "next/link";

const NotFound: React.FC = async () => {
  //* Variables
  const { t } = await initTranslations("en-US");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1729] px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e2d42] opacity-40 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Anchor icon with subtle sway animation */}
        <div className="mb-8 animate-[sway_4s_ease-in-out_infinite]">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-[#92b0be]/20 bg-[#1e2d42]/60 shadow-lg shadow-black/20 backdrop-blur-sm">
            <Anchor className="size-9 text-[#d4b896]" strokeWidth={1.5} />
          </div>
        </div>

        {/* Error code */}
        <p className="mb-3 font-mono text-sm tracking-[0.3em] text-[#92b0be]">404</p>

        {/* Heading */}
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-white">{t("pageNotFound")}</h1>

        {/* Description */}
        <p className="mb-10 leading-relaxed text-[#92b0be]/80">
          {t("looksLikeYouveDriftedOffCourseThePageYoureLookingForDoesntExistOrHasBeenMoved")}
        </p>

        {/* CTA */}
        <Button
          asChild
          className="border border-[#92b0be]/30 bg-[#1e2d42] text-white hover:border-[#92b0be]/50 hover:bg-[#2d3e56]"
          size="lg"
        >
          <Link href="/">
            <Home className="size-4" />
            {t("returnHome")}
          </Link>
        </Button>
      </div>

      {/* Sway keyframes */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
