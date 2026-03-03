export type SiteWordmarkProps = {
  size?: "lg" | "md" | "sm";
};

const sizeMap = {
  lg: "text-3xl tracking-[0.55em]",
  md: "text-xl tracking-[0.55em]",
  sm: "text-lg tracking-[0.45em]",
};

export const SiteWordmark: React.FC<SiteWordmarkProps> = ({ size = "md" }) => {
  return (
    <span className={`font-bold uppercase ${sizeMap[size]}`} style={{ color: `rgb(var(--m-accent))` }}>
      Anchr
    </span>
  );
};
