import { cn } from "@/lib/utils";

export type SiteWordmarkProps = {
  size?: "lg" | "md" | "sm" | "xl";
};

const sizeMap = {
  lg: "text-3xl tracking-[0.55em]",
  md: "text-xl tracking-[0.55em]",
  sm: "text-lg tracking-[0.45em]",
  xl: "text-4xl tracking-[0.55em]",
};

export const SiteWordmark: React.FC<SiteWordmarkProps> = ({ size = "md" }) => {
  return <span className={cn("m-accent-color font-bold uppercase", sizeMap[size])}>Anchr</span>;
};
