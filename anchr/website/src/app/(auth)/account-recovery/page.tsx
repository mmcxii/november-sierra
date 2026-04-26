import { AccountRecoveryForm } from "@/components/auth/account-recovery-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Account recovery",
};

const AccountRecoveryPage: React.FC = () => {
  return <AccountRecoveryForm />;
};

export default AccountRecoveryPage;
