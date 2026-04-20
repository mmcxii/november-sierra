import { BetterAuthPasswordResetForm } from "@/components/auth/better-auth/password-reset-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Reset password (Better Auth)",
};

const BetterAuthResetPasswordPage: React.FC = () => {
  return <BetterAuthPasswordResetForm />;
};

export default BetterAuthResetPasswordPage;
