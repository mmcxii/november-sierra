"use client";

import { assignThemeToSlot, createCustomTheme, updateCustomTheme } from "@/app/(dashboard)/dashboard/theme/actions";
import { PagePreview } from "@/components/dashboard/page-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  generateCssScaffold,
  parseCssToThemeState,
  updateProPropertyInCss,
  updateVariableInCss,
} from "@/lib/css-theme-sync";
import {
  PRESET_THEME_VARIABLES,
  THEME_NAME_MAX_LENGTH,
  type ThemeVariableKey,
  type ThemeVariables,
} from "@/lib/custom-themes";
import type { customThemesTable } from "@/lib/db/schema/custom-theme";
import type { usersTable } from "@/lib/db/schema/user";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { isProUser } from "@/lib/tier";
import { generateThemeName, variablesToInlineStyle } from "@/lib/utils/custom-theme";
import { ExternalLink, Eye, Loader2, Lock, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SECTIONS } from "./constants";

type CustomTheme = typeof customThemesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;

export type ThemeStudioContentProps =
  | {
      existingNames: string[];
      initialName?: string;
      initialVariables?: ThemeVariables;
      mode: "create";
      user: User;
    }
  | {
      existingNames: string[];
      mode: "edit";
      theme: CustomTheme;
      user: User;
    };

export const ThemeStudioContent: React.FC<ThemeStudioContentProps> = (props) => {
  const { existingNames, mode, user } = props;

  const isPro = isProUser(user);
  const { t } = useTranslation();
  const router = useRouter();

  //* Initial state
  const defaultVariables = PRESET_THEME_VARIABLES["dark-depths"];
  const initialTheme = mode === "edit" ? props.theme : null;
  const initialVars =
    mode === "edit" && initialTheme != null
      ? (initialTheme.variables as ThemeVariables)
      : ((mode === "create" ? props.initialVariables : undefined) ?? defaultVariables);

  const themeId = initialTheme?.id ?? null;

  const [name, setName] = React.useState(
    mode === "edit" && initialTheme != null
      ? initialTheme.name
      : ((mode === "create" ? props.initialName : undefined) ?? generateThemeName(existingNames)),
  );
  const [variables, setVariables] = React.useState<ThemeVariables>({ ...initialVars });
  const [font, setFont] = React.useState(initialTheme?.font ?? "");
  const [borderRadius, setBorderRadius] = React.useState(initialTheme?.borderRadius ?? 12);
  const [rawCss, setRawCss] = React.useState(initialTheme?.rawCss ?? "");
  const [showRawCss, setShowRawCss] = React.useState(false);
  const [isSaving, startSaveTransition] = React.useTransition();
  const [showPreview, setShowPreview] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [previewVersion, setPreviewVersion] = React.useState(0);
  const previewKey = `${name}|${previewVersion}`;

  // Guard to prevent infinite sync loops between CSS editor and UI inputs
  const syncSourceRef = React.useRef<null | "css" | "ui">(null);

  //* Mark dirty on any change
  React.useEffect(() => {
    setIsDirty(true);
  }, [name, variables, font, borderRadius, rawCss]);

  //* Live preview — post all theme data to the preview iframe on every change
  React.useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe[title]");
    if (iframe?.contentWindow == null) {
      return;
    }

    const vars = variablesToInlineStyle(variables);
    iframe.contentWindow.postMessage(
      {
        borderRadius: isPro ? borderRadius : null,
        font: isPro && font.trim() !== "" ? font : null,
        rawCss: isPro ? rawCss : null,
        type: "theme-studio-preview",
        variables: vars,
      },
      "*",
    );
  }, [variables, font, borderRadius, rawCss, isPro]);

  //* Exit guard
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  //* CSS → UI sync (debounced): parse CSS editor changes back into UI state
  React.useEffect(() => {
    if (syncSourceRef.current === "ui") {
      syncSourceRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      if (rawCss.trim() === "") {
        return;
      }

      const parsed = parseCssToThemeState(rawCss);

      // Only update if we actually parsed something
      if (Object.keys(parsed.variables).length > 0) {
        syncSourceRef.current = "css";
        setVariables((prev) => ({ ...prev, ...parsed.variables }));
      }

      if (parsed.pro.font !== undefined) {
        setFont(parsed.pro.font ?? "");
      }
      if (parsed.pro.borderRadius !== undefined) {
        setBorderRadius(parsed.pro.borderRadius ?? 12);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [rawCss]);

  //* Variable change handler (curried for use in map iterations) — UI → CSS sync
  const handleVariableChange = React.useCallback(
    (key: keyof ThemeVariables) => (value: string) => {
      syncSourceRef.current = "ui";
      setVariables((prev) => ({ ...prev, [key]: value }));
      setRawCss((prev) => {
        if (prev.trim() === "") {
          return prev;
        }
        return updateVariableInCss(prev, key as ThemeVariableKey, value);
      });
    },
    [],
  );

  const handleNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleFontChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFont = e.target.value;
    syncSourceRef.current = "ui";
    setFont(newFont);
    setRawCss((prev) => {
      if (prev.trim() === "") {
        return prev;
      }
      return updateProPropertyInCss(prev, "font", newFont.trim() !== "" ? newFont : null);
    });
  }, []);

  const handleBorderRadiusChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value, 10) || 0;
    syncSourceRef.current = "ui";
    setBorderRadius(newRadius);
    setRawCss((prev) => {
      if (prev.trim() === "") {
        return prev;
      }
      return updateProPropertyInCss(prev, "borderRadius", newRadius);
    });
  }, []);

  const handleToggleRawCss = React.useCallback(() => {
    setShowRawCss((prev) => {
      const willShow = !prev;
      // Generate scaffold when opening editor for the first time with no CSS
      if (willShow && rawCss.trim() === "") {
        const scaffold = generateCssScaffold(variables, {
          backgroundImage: null,
          borderRadius: isPro ? borderRadius : null,
          font: isPro && font.trim() !== "" ? font : null,
          overlayColor: null,
          overlayOpacity: null,
        });
        setRawCss(scaffold);
      }
      return willShow;
    });
  }, [rawCss, variables, isPro, borderRadius, font]);

  const handleRawCssChange = React.useCallback((v: undefined | string) => {
    setRawCss(v ?? "");
  }, []);

  const handleShowPreview = React.useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleClosePreview = React.useCallback(() => {
    setShowPreview(false);
  }, []);

  //* Save handler
  const handleSave = () => {
    startSaveTransition(async () => {
      const data = {
        backgroundImage: null,
        borderRadius: isPro ? borderRadius : null,
        font: isPro && font.trim() !== "" ? font.trim() : null,
        name,
        overlayColor: null,
        overlayOpacity: null,
        rawCss: isPro && rawCss.trim() !== "" ? rawCss.trim() : null,
        variables,
      };

      if (mode === "create") {
        const result = await createCustomTheme(data);
        if (!result.success) {
          toast.error(t(result.error as TranslationKey));
          return;
        }
        toast.success(t("themeCreated"));
        setIsDirty(false);
        setPreviewVersion((v) => v + 1);
        if (result.themeId != null) {
          router.push(`/dashboard/theme/studio/${result.themeId}`);
        }
        router.refresh();
      } else if (themeId != null) {
        const result = await updateCustomTheme(themeId, data);
        if (!result.success) {
          toast.error(t(result.error as TranslationKey));
          return;
        }
        toast.success(t("themeUpdated"));
        setIsDirty(false);
        setPreviewVersion((v) => v + 1);
        router.refresh();
      }
    });
  };

  //* Save & Apply handler
  const handleSaveAndApply = React.useCallback(
    (slot: "both" | "dark" | "light") => {
      startSaveTransition(async () => {
        const data = {
          backgroundImage: null,
          borderRadius: isPro ? borderRadius : null,
          font: isPro && font.trim() !== "" ? font.trim() : null,
          name,
          overlayColor: null,
          overlayOpacity: null,
          rawCss: isPro && rawCss.trim() !== "" ? rawCss.trim() : null,
          variables,
        };

        let savedThemeId: undefined | string;

        if (mode === "create") {
          const result = await createCustomTheme(data);
          if (!result.success) {
            toast.error(t(result.error as TranslationKey));
            return;
          }
          savedThemeId = result.themeId;
        } else if (themeId != null) {
          const result = await updateCustomTheme(themeId, data);
          if (!result.success) {
            toast.error(t(result.error as TranslationKey));
            return;
          }
          savedThemeId = themeId;
        }

        if (savedThemeId == null) {
          return;
        }

        // Apply to slots
        if (slot === "dark" || slot === "both") {
          const darkResult = await assignThemeToSlot("pageDarkTheme", savedThemeId);
          if (!darkResult.success) {
            toast.error(t(darkResult.error as TranslationKey));
            return;
          }
        }
        if (slot === "light" || slot === "both") {
          const lightResult = await assignThemeToSlot("pageLightTheme", savedThemeId);
          if (!lightResult.success) {
            toast.error(t(lightResult.error as TranslationKey));
            return;
          }
        }

        toast.success(t("themeSaved"));
        setIsDirty(false);
        setPreviewVersion((v) => v + 1);
        if (mode === "create") {
          router.push(`/dashboard/theme/studio/${savedThemeId}`);
        }
        router.refresh();
      });
    },
    [borderRadius, font, isPro, mode, name, rawCss, router, t, themeId, variables],
  );

  const handleApplyDark = React.useCallback(() => {
    handleSaveAndApply("dark");
  }, [handleSaveAndApply]);

  const handleApplyLight = React.useCallback(() => {
    handleSaveAndApply("light");
  }, [handleSaveAndApply]);

  const handleApplyBoth = React.useCallback(() => {
    handleSaveAndApply("both");
  }, [handleSaveAndApply]);

  //* Monaco lazy load
  const MonacoEditor = React.useMemo(
    () => (showRawCss && isPro ? React.lazy(() => import("@monaco-editor/react")) : null),
    [showRawCss, isPro],
  );

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Editor panel */}
      <div className="flex-1 space-y-6">
        {/* Theme name */}
        <Card>
          <CardContent className="pt-6">
            <Input
              maxLength={THEME_NAME_MAX_LENGTH}
              onChange={handleNameChange}
              placeholder={t("customTheme")}
              value={name}
            />
          </CardContent>
        </Card>

        {/* Color sections */}
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-sm">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.fields.map((field) => (
                  <ColorPicker
                    gradient={field.gradient}
                    gradientLabels={{ end: t("endColor"), gradient: t("gradient"), start: t("startColor") }}
                    key={field.key}
                    label={field.label}
                    onChange={handleVariableChange(field.key)}
                    onGradientChange={field.gradient ? handleVariableChange(field.key) : undefined}
                    value={variables[field.key]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Pro-only: Font */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {t("font")}
              {!isPro && <Lock className="text-muted-foreground size-3.5" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input disabled={!isPro} onChange={handleFontChange} placeholder="Inter" value={font} />
              <a
                className="text-primary flex shrink-0 items-center gap-1 text-xs hover:underline"
                href="https://fonts.google.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("browseGoogleFonts")}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Pro-only: Border Radius */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {t("borderRadius")}
              {!isPro && <Lock className="text-muted-foreground size-3.5" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                className="flex-1"
                disabled={!isPro}
                max={50}
                min={0}
                onChange={handleBorderRadiusChange}
                type="range"
                value={borderRadius}
              />
              <span className="text-muted-foreground w-12 text-right font-mono text-sm">
                {t("{{value}}Px", { value: borderRadius })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pro-only: Raw CSS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {t("advancedCss")}
              {!isPro && <Lock className="text-muted-foreground size-3.5" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <>
                <Button onClick={handleToggleRawCss} size="sm" variant="secondary">
                  {showRawCss ? t("hideEditor") : t("showEditor")}
                </Button>
                {showRawCss && MonacoEditor != null && (
                  <React.Suspense
                    fallback={
                      <div className="flex h-64 items-center justify-center">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    }
                  >
                    <div className="mt-3 overflow-hidden rounded-md border">
                      <MonacoEditor
                        defaultLanguage="css"
                        height="256px"
                        onChange={handleRawCssChange}
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                        }}
                        theme="vs-dark"
                        value={rawCss}
                      />
                    </div>
                  </React.Suspense>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("upgradeToProToUseTheRawCssEditor")}</p>
            )}
          </CardContent>
        </Card>

        {/* Actions bar */}
        <div className="bg-background sticky bottom-0 flex items-center gap-3 border-t py-4">
          <Button disabled={isSaving} onClick={handleSave} variant="secondary">
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            <Save className="size-3.5" />
            {t("saveTheme")}
          </Button>

          <div className="relative">
            <Button disabled={isSaving} onClick={handleApplyDark} size="sm">
              {t("applyToDarkSlot")}
            </Button>
          </div>
          <Button disabled={isSaving} onClick={handleApplyLight} size="sm">
            {t("applyToLightSlot")}
          </Button>
          <Button disabled={isSaving} onClick={handleApplyBoth} size="sm">
            {t("applyToBothSlots")}
          </Button>
        </div>
      </div>

      {/* Desktop preview */}
      <div className="hidden xl:block xl:w-96">
        <div className="sticky top-6">
          <PagePreview previewKey={previewKey} user={user} />
        </div>
      </div>

      {/* Mobile preview button + overlay */}
      <div className="xl:hidden">
        <button
          className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 flex size-12 items-center justify-center rounded-full shadow-lg"
          onClick={handleShowPreview}
          type="button"
        >
          <Eye className="size-5" />
        </button>

        {showPreview && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
            <div className="flex justify-end p-4">
              <Button onClick={handleClosePreview} size="sm" variant="secondary">
                {t("close")}
              </Button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <PagePreview hideHeader previewKey={previewKey} user={user} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
