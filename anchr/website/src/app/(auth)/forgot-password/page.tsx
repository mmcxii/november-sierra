import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Forgot password",
};

const ForgotPasswordPage: React.FC = () => {
  return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;
