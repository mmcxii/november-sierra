import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Container } from "@/components/ui/container";
import { isAdmin, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import * as React from "react";

export type DashboardLayoutProps = React.PropsWithChildren;

const DashboardLayout: React.FC<DashboardLayoutProps> = async (props) => {
  const { children } = props;

  //* Variables
  const user = await requireUser();

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col lg:flex-row">
      <DashboardSidebar isAdmin={isAdmin(user.id)} user={user} />
      <Container as="main" className="flex-1 py-6">
        {children}
      </Container>
    </div>
  );
};

export default DashboardLayout;
