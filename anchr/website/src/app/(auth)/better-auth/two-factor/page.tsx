import { BetterAuthTwoFactorForm } from "@/components/auth/better-auth/two-factor-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Two-factor (Better Auth)",
};

const BetterAuthTwoFactorPage: React.FC = () => {
  return <BetterAuthTwoFactorForm />;
};

export default BetterAuthTwoFactorPage;
