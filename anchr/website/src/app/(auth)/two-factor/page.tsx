import { TwoFactorForm } from "@/components/auth/two-factor-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Two-factor authentication",
};

const TwoFactorPage: React.FC = () => {
  return <TwoFactorForm />;
};

export default TwoFactorPage;
