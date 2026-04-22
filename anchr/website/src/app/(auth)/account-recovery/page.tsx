import { BetterAuthAccountRecoveryForm } from "@/components/auth/better-auth/account-recovery-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Account recovery",
};

const AccountRecoveryPage: React.FC = () => {
  return <BetterAuthAccountRecoveryForm />;
};

export default AccountRecoveryPage;
