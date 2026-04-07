import { SignUpForm } from "@/components/auth/sign-up-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Sign up",
};

const SignUpPage: React.FC = () => {
  return <SignUpForm />;
};

export default SignUpPage;
