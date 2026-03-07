import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground text-sm">Dashboard placeholder</p>
    </div>
  );
};

export default DashboardPage;
