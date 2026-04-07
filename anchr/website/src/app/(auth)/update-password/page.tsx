import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Update password",
};

const UpdatePasswordPage: React.FC = () => {
  return <UpdatePasswordForm />;
};

export default UpdatePasswordPage;
