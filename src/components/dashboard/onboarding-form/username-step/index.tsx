import { checkUsernameAvailability, updateUsername } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UsernameValues, usernameSchema } from "@/lib/schemas/username";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Check, Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type UsernameStepProps = {
  defaultUsername: string;
  onComplete: () => void;
};

export const UsernameStep: React.FC<UsernameStepProps> = (props) => {
  const { defaultUsername, onComplete } = props;

  //* State
  const { t } = useTranslation();
  const form = useForm<UsernameValues>({
    defaultValues: { username: defaultUsername },
    mode: "onChange",
    resolver: standardSchemaResolver(usernameSchema),
  });
  const [availability, setAvailability] = React.useState<"available" | "checking" | "idle" | "taken">("idle");

  //* Refs
  const debounceRef = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  //* Variables
  const username = form.watch("username");
  const hasValidationError = !!form.formState.errors.username;

  //* Handlers
  const handleSubmit = async (data: UsernameValues) => {
    const result = await updateUsername(data.username);

    if (result.success != null) {
      onComplete();
    } else if (result.error != null) {
      form.setError("root", { message: t(result.error) });
    }
  };

  //* Effects
  React.useEffect(() => {
    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
    }

    if (hasValidationError ?? username.length < 1) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");

    debounceRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      setAvailability(result.available != null ? "available" : "taken");
    }, 400);

    return () => {
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [username, hasValidationError]);

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("chooseYourUsername")}</h1>
        <p className="text-muted-foreground text-sm">{t("thisWillBeYourUniqueAnchrToUrl")}</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">{t("username")}</Label>
          <div className="relative">
            <Input
              autoComplete="username"
              autoFocus
              disabled={form.formState.isSubmitting}
              id="username"
              placeholder="your_username"
              {...form.register("username")}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              {availability === "checking" && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
              {availability === "available" && <Check className="size-4 text-emerald-500" />}
              {availability === "taken" && <X className="size-4 text-red-500" />}
            </div>
          </div>
          {form.formState.errors.username != null && (
            <p className="text-destructive text-xs">{form.formState.errors.username.message}</p>
          )}
          {availability === "taken" && !hasValidationError && (
            <p className="text-destructive text-xs">{t("thisUsernameIsAlreadyTaken")}</p>
          )}
          {availability === "available" && !hasValidationError && (
            <p className="text-xs text-emerald-500">{t("usernameIsAvailable")}</p>
          )}
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- brand URL prefix with dynamic username */}
          <p className="text-muted-foreground text-xs">anchr.to/{username ?? "username"}</p>
        </div>

        {form.formState.errors.root != null && (
          <p className="text-destructive text-center text-xs">{form.formState.errors.root.message}</p>
        )}

        <Button className="w-full" disabled={form.formState.isSubmitting || availability !== "available"} type="submit">
          {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
        </Button>
      </form>
    </>
  );
};
