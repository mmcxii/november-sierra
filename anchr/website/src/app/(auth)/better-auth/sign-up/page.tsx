import { BetterAuthSignUpForm } from "@/components/auth/better-auth/sign-up-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Sign up (Better Auth)",
};

const BetterAuthSignUpPage: React.FC = () => {
  return <BetterAuthSignUpForm />;
};

export default BetterAuthSignUpPage;
