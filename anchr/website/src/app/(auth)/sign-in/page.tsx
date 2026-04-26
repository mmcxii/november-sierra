import { SignInForm } from "@/components/auth/sign-in-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Sign in",
};

const SignInPage: React.FC = () => {
  return <SignInForm />;
};

export default SignInPage;
