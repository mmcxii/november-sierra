"use client";

import { createLink, updateLink } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LinkValues, linkSchema } from "@/lib/schemas/link";
import { ensureProtocol } from "@/lib/utils/url";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type LinkFormProps = {
  defaultValues?: { id: string; title: string; url: string };
  onSuccess: () => void;
};

export const LinkForm: React.FC<LinkFormProps> = (props) => {
  const { defaultValues, onSuccess } = props;

  //* State
  const { t } = useTranslation();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LinkValues>({
    defaultValues: defaultValues != null ? { title: defaultValues.title, url: defaultValues.url } : undefined,
    resolver: standardSchemaResolver(linkSchema),
  });

  //* Refs
  const titleRef = React.useRef<null | HTMLInputElement>(null);

  //* Variables
  const isEditing = defaultValues != null;
  const { ref: titleRegisterRef, ...titleRegisterRest } = register("title");

  //* Handlers
  const onSubmit = async (data: LinkValues) => {
    const url = ensureProtocol(data.url);

    const result = isEditing ? await updateLink(defaultValues.id, data.title, url) : await createLink(data.title, url);

    if (!result.success) {
      setError("root", { message: t(result.error ?? "somethingWentWrongPleaseTryAgain") });
      return;
    }

    onSuccess();
  };

  //* Effects
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-title">{t("title")}</Label>
        <Input
          disabled={isSubmitting}
          id="link-title"
          placeholder={t("title")}
          ref={(el) => {
            titleRegisterRef(el);
            titleRef.current = el;
          }}
          {...titleRegisterRest}
        />
        {errors.title != null && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-url">{t("url")}</Label>
        <Input disabled={isSubmitting} id="link-url" placeholder="https://" type="url" {...register("url")} />
        {errors.url != null && <p className="text-destructive text-xs">{errors.url.message}</p>}
      </div>
      {errors.root != null && <p className="text-destructive text-center text-xs">{errors.root.message}</p>}
      <div className="flex flex-col sm:flex-row sm:justify-start">
        <Button disabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
