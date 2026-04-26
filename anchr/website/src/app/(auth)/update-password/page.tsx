import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import type { Metadata } from "next";
import * as React from "react";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = async (props) => {
  const { token } = await props.searchParams;
  return <UpdatePasswordForm token={token ?? null} />;
};

export const metadata: Metadata = {
  title: "Update password",
};

export default UpdatePasswordPage;
