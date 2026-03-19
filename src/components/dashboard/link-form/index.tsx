"use client";

import { createLink, updateLink } from "@/app/(dashboard)/dashboard/actions";
import { PlatformBadge } from "@/components/dashboard/platform-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectPlatform } from "@/lib/platforms";
import { type LinkValues, linkSchema } from "@/lib/schemas/link";
import { ensureProtocol, generateSlug } from "@/lib/utils/url";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type LinkFormProps = {
  defaultValues?: { id: string; slug: string; title: string; url: string };
  existingSlugs: string[];
  username: string;
  onSuccess: () => void;
};

export const LinkForm: React.FC<LinkFormProps> = (props) => {
  const { defaultValues, existingSlugs, onSuccess, username } = props;

  //* State
  const { t } = useTranslation();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<LinkValues>({
    defaultValues:
      defaultValues != null
        ? { slug: defaultValues.slug, title: defaultValues.title, url: defaultValues.url }
        : undefined,
    resolver: standardSchemaResolver(linkSchema),
  });

  const [skipUrlCheck, setSkipUrlCheck] = React.useState(false);
  const [showSkipUrlCheck, setShowSkipUrlCheck] = React.useState(false);

  //* Refs
  const titleRef = React.useRef<null | HTMLInputElement>(null);

  //* Variables
  const isEditing = defaultValues != null;
  const urlValue = watch("url");
  const detectedPlatform = urlValue != null && urlValue.length > 0 ? detectPlatform(urlValue) : null;
  const slugPlaceholder = urlValue != null && urlValue.length > 0 ? generateSlug(ensureProtocol(urlValue)) : "";
  const { ref: titleRegisterRef, ...titleRegisterRest } = register("title");
  const URL_UNREACHABLE_KEY = "thisUrlCouldNotBeReachedPleaseCheckItAndTryAgain";

  //* Handlers
  const validateSlugUniqueness = (slug: undefined | string): boolean => {
    if (slug == null || slug.length === 0) {
      return true; // Empty slug means auto-generate
    }
    const otherSlugs = isEditing ? existingSlugs.filter((s) => s !== defaultValues.slug) : existingSlugs;
    if (otherSlugs.includes(slug)) {
      setError("slug", { message: t("thisSlugIsAlreadyInUse") });
      return false;
    }
    return true;
  };

  const handleActionError = (error: undefined | string): void => {
    const key = error ?? "somethingWentWrongPleaseTryAgain";

    if (key === URL_UNREACHABLE_KEY) {
      setError("url", { message: t(key) });
      setShowSkipUrlCheck(true);
      return;
    }

    setError("root", { message: t(key) });
  };

  const submitLink = async (data: LinkValues): Promise<boolean> => {
    if (!validateSlugUniqueness(data.slug)) {
      return false;
    }

    const url = ensureProtocol(data.url);

    const result = isEditing
      ? await updateLink(defaultValues.id, data.title, url, data.slug, skipUrlCheck)
      : await createLink(data.title, url, data.slug, skipUrlCheck);

    if (!result.success) {
      handleActionError(result.error);
      return false;
    }

    return true;
  };

  const onSubmit = async (data: LinkValues) => {
    if (await submitLink(data)) {
      onSuccess();
    }
  };

  const handleSaveAndAddAnother = () => {
    handleSubmit(async (data: LinkValues) => {
      if (!(await submitLink(data))) {
        return;
      }

      reset();
      setSkipUrlCheck(false);
      setShowSkipUrlCheck(false);
      titleRef.current?.focus();
    })();
  };

  //* Effects
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Reset skip URL check when URL changes
  React.useEffect(() => {
    setSkipUrlCheck(false);
    setShowSkipUrlCheck(false);
  }, [urlValue]);

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
        {errors.title?.message != null && <p className="text-destructive text-xs">{t(errors.title.message)}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-url">{t("url")}</Label>
        <Input disabled={isSubmitting} id="link-url" placeholder="https://" {...register("url")} />
        {detectedPlatform != null && (
          <div className="flex">
            <PlatformBadge platform={detectedPlatform} />
          </div>
        )}
        {errors.url?.message != null && <p className="text-destructive text-xs">{errors.url.message}</p>}
        {showSkipUrlCheck && (
          <label className="flex items-center gap-2">
            <Checkbox checked={skipUrlCheck} onCheckedChange={(checked) => setSkipUrlCheck(checked === true)} />
            <span className="text-muted-foreground text-xs">{t("saveAnyway")}</span>
          </label>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-slug">{t("redirectUrl")}</Label>
        <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center overflow-hidden rounded-md border shadow-xs focus-within:ring-[3px]">
          <span className="text-muted-foreground bg-muted flex h-full shrink-0 items-center border-r px-2.5 text-xs">
            anchr.to/{username}/
          </span>
          <input
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none disabled:pointer-events-none disabled:opacity-50"
            disabled={isSubmitting}
            id="link-slug"
            placeholder={slugPlaceholder}
            {...register("slug")}
          />
        </div>
        {errors.slug?.message != null && <p className="text-destructive text-xs">{t(errors.slug.message)}</p>}
      </div>
      {errors.root != null && <p className="text-destructive text-center text-xs">{errors.root.message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
        <Button disabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {t("save")}
        </Button>
        {!isEditing && (
          <Button disabled={isSubmitting} onClick={handleSaveAndAddAnother} type="button" variant="secondary">
            {t("saveAndAddAnother")}
          </Button>
        )}
      </div>
    </form>
  );
};
