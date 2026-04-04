import { cn } from "@/lib/utils";

export type HamburgerIconProps = { open: boolean };

export const HamburgerIcon: React.FC<HamburgerIconProps> = (props) => {
  const { open } = props;

  return (
    <div className="flex h-4 w-5 flex-col justify-between">
      <span
        className={cn(
          "block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
          { "translate-y-[7px] rotate-45": open },
        )}
      />
      <span
        className={cn("block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ease-in-out", {
          "opacity-0": open,
        })}
      />
      <span
        className={cn(
          "block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
          { "-translate-y-[7px] -rotate-45": open },
        )}
      />
    </div>
  );
};
