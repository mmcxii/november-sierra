"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignInValues, signInSchema } from "@/lib/schemas/auth";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const SignInForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded, setActive, signIn } = useSignIn();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<SignInValues>({
    resolver: standardSchemaResolver(signInSchema),
  });

  //* Handlers
  const onSubmit = async (data: SignInValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
        strategy: "password",
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        for (const e of err.errors) {
          switch (e.meta?.paramName) {
            case "identifier":
              setError("email", {
                message: e.longMessage ?? e.message,
              });
              break;

            case "password":
              setError("password", {
                message: e.longMessage ?? e.message,
              });
              break;

            default:
              setError("root", {
                message: e.longMessage ?? e.message,
              });
              break;
          }
        }
      } else {
        setError("root", {
          message: t("somethingWentWrongPleaseTryAgain"),
        });
      }
    }
  };

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
      <div className="flex flex-col items-center">
        <span className="text-xs tracking-[0.35em] text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("signIn")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("welcomeBack")}</CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...register("email")}
            />
            {errors.email != null && <p className="text-xs text-[rgb(var(--m-accent))]">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="password">
              {t("password")}
            </Label>
            <Input
              autoComplete="current-password"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={isSubmitting}
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{errors.password.message}</p>
            )}
          </div>
          {errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">{errors.root.message}</p>
          )}
          <Button className="w-full" disabled={!isLoaded || isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="w-full max-w-sm justify-center pt-6">
        <p className="text-sm text-[rgb(var(--m-muted))]">
          <Trans
            components={{
              1: (
                <Link
                  className="font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
                  href="/sign-up"
                />
              ),
            }}
            i18nKey="dontHaveAnAccountSignUp"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
