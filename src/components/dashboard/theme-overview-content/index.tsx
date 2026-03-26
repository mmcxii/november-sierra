"use client";

import { updatePageDarkTheme, updatePageLightTheme } from "@/app/(dashboard)/dashboard/settings/actions";
import { deleteCustomTheme, updateThemeToggles } from "@/app/(dashboard)/dashboard/theme/actions";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { useDashboardTheme } from "@/components/dashboard/theme-provider/context";
import { ThemeSwatch } from "@/components/dashboard/theme-swatch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ThemeVariables } from "@/lib/custom-themes";
import type { customThemesTable } from "@/lib/db/schema/custom-theme";
import type { usersTable } from "@/lib/db/schema/user";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST, THEMES, type ThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { deriveSwatchFromVariables } from "@/lib/utils/custom-theme";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type CustomTheme = typeof customThemesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;

export type ThemeOverviewContentProps = {
  customThemes: CustomTheme[];
  pageDarkEnabled: boolean;
  pageDarkThemeId: ThemeId;
  pageLightEnabled: boolean;
  pageLightThemeId: ThemeId;
  user: User;
};

export const ThemeOverviewContent: React.FC<ThemeOverviewContentProps> = (props) => {
  const { customThemes, user } = props;

  const { pageDarkThemeId, pageLightThemeId } = props;

  const { t } = useTranslation();
  const router = useRouter();
  const isPro = isProUser(user);
  const { preferredDark, preferredLight, setPreferredDark, setPreferredLight } = useDashboardTheme();

  const [lightEnabled, setLightEnabled] = React.useState(props.pageLightEnabled);
  const [darkEnabled, setDarkEnabled] = React.useState(props.pageDarkEnabled);
  const [isTogglingLight, startLightTransition] = React.useTransition();
  const [isTogglingDark, startDarkTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<null | string>(null);

  //* Handlers

  const handleLightToggle = (checked: boolean) => {
    if (!checked && !darkEnabled) {
      toast.error(t("atLeastOneThemeMustBeEnabled"));
      return;
    }
    setLightEnabled(checked);
    startLightTransition(async () => {
      const result = await updateThemeToggles(checked, darkEnabled);
      if (!result.success) {
        setLightEnabled(!checked);
        toast.error(t(result.error));
      }
    });
  };

  const handleDarkToggle = (checked: boolean) => {
    if (!checked && !lightEnabled) {
      toast.error(t("atLeastOneThemeMustBeEnabled"));
      return;
    }
    setDarkEnabled(checked);
    startDarkTransition(async () => {
      const result = await updateThemeToggles(lightEnabled, checked);
      if (!result.success) {
        setDarkEnabled(!checked);
        toast.error(t(result.error));
      }
    });
  };

  const handleDeleteTheme = async (themeId: string) => {
    setDeletingId(themeId);
    const result = await deleteCustomTheme(themeId);
    if (!result.success) {
      toast.error(t(result.error));
    } else {
      toast.success(t("themeDeleted"));
      router.refresh();
    }
    setDeletingId(null);
  };

  const handlePageThemeChange = () => {
    router.refresh();
  };

  //* Dashboard theme handlers
  const handleDarkThemeSwatchOnClick = (id: ThemeId) => () => setPreferredDark(id);
  const handleLightThemeSwatchOnClick = (id: ThemeId) => () => setPreferredLight(id);

  return (
    <div className="space-y-6">
      {/* Dashboard Theme */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboardTheme")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("darkTheme")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DARK_THEME_ID_LIST.map((id) => (
                <ThemeSwatch
                  isSelected={preferredDark === id}
                  key={id}
                  name={THEMES[id].name}
                  onClick={handleDarkThemeSwatchOnClick(id)}
                  swatch={THEMES[id].swatch}
                  variant="dashboard"
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("lightTheme")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LIGHT_THEME_ID_LIST.map((id) => (
                <ThemeSwatch
                  isSelected={preferredLight === id}
                  key={id}
                  name={THEMES[id].name}
                  onClick={handleLightThemeSwatchOnClick(id)}
                  swatch={THEMES[id].swatch}
                  variant="dashboard"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Theme */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pageTheme")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light/Dark toggles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2">
              <Switch checked={lightEnabled} disabled={isTogglingLight} onCheckedChange={handleLightToggle} />
              <span className="text-sm">{t("enableLightTheme")}</span>
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={darkEnabled} disabled={isTogglingDark} onCheckedChange={handleDarkToggle} />
              <span className="text-sm">{t("enableDarkTheme")}</span>
            </label>
          </div>

          {/* Dark theme picker */}
          {darkEnabled && (
            <div>
              <p className="text-muted-foreground mb-3 text-sm font-medium">{t("darkTheme")}</p>
              <ThemePicker
                action={updatePageDarkTheme}
                currentThemeId={pageDarkThemeId}
                onThemeChange={handlePageThemeChange}
                themeIds={DARK_THEME_ID_LIST}
              />
            </div>
          )}

          {/* Light theme picker */}
          {lightEnabled && (
            <div>
              <p className="text-muted-foreground mb-3 text-sm font-medium">{t("lightTheme")}</p>
              <ThemePicker
                action={updatePageLightTheme}
                currentThemeId={pageLightThemeId}
                onThemeChange={handlePageThemeChange}
                themeIds={LIGHT_THEME_ID_LIST}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Themes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("customTheme")}</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/theme/studio/new">
              <Plus className="size-4" />
              {t("createTheme")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customThemes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("youCanCreate{{max}}CustomThemes", { max: isPro ? 10 : 2 })}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {customThemes.map((theme) => {
                const swatch = deriveSwatchFromVariables(theme.variables as ThemeVariables);
                const handleThemeSwatchOnClick = () => {};

                const handleButtonOnClick = () => handleDeleteTheme(theme.id);

                return (
                  <div className="group relative" key={theme.id}>
                    <ThemeSwatch
                      isSelected={user.pageDarkTheme === theme.id || user.pageLightTheme === theme.id}
                      name={theme.name}
                      onClick={handleThemeSwatchOnClick}
                      swatch={swatch}
                      variant="page"
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        className="bg-background/80 hover:bg-background rounded p-1 backdrop-blur-sm"
                        href={`/dashboard/theme/studio/${theme.id}`}
                        title={t("editTheme")}
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <Link
                        className="bg-background/80 hover:bg-background rounded p-1 backdrop-blur-sm"
                        href={`/dashboard/theme/studio/new?from=${theme.id}`}
                        title={t("customize")}
                      >
                        <Copy className="size-3.5" />
                      </Link>
                      <button
                        className="bg-background/80 hover:bg-background text-destructive rounded p-1 backdrop-blur-sm"
                        disabled={deletingId === theme.id}
                        onClick={handleButtonOnClick}
                        title={t("deleteTheme")}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
