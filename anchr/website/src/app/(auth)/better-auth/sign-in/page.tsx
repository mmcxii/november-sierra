import { BetterAuthSignInForm } from "@/components/auth/better-auth/sign-in-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Sign in (Better Auth)",
};

const BetterAuthSignInPage: React.FC = () => {
  return <BetterAuthSignInForm />;
};

export default BetterAuthSignInPage;
