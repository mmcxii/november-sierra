import { SiteLogo, type SiteLogoProps } from "@/components/marketing/site-logo";
import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { cn } from "@/lib/utils";
import { SIZE_MAP } from "./constants";

export type SiteBrandmarkProps = {
  as?: React.ElementType;
  className?: string;
  dividerClassName?: string;
  logoProps?: Omit<SiteLogoProps, "size">;
  size?: "sm" | "xs";
  wordmarkClassName?: string;
};

export const SiteBrandmark: React.FC<SiteBrandmarkProps> = (props) => {
  const { as: Component = "span", className, dividerClassName, logoProps, size = "sm", wordmarkClassName } = props;

  const s = SIZE_MAP[size];

  return (
    <Component className={cn("inline-flex items-center gap-3", className)}>
      <SiteLogo size={s.logo} {...logoProps} />
      <div aria-hidden="true" className={cn("m-accent-divider-25 w-px", s.divider, dividerClassName)} />
      <SiteWordmark className={wordmarkClassName} size={s.wordmark} />
    </Component>
  );
};
