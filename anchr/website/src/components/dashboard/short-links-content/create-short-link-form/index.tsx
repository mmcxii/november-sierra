"use client";

import { createShortLinkAction } from "@/app/(dashboard)/dashboard/short-links/actions";
import type { ShortLinkItem } from "@/components/dashboard/short-links-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

type CustomParam = {
  id: string;
  key: string;
  value: string;
};

type CreateShortLinkFormProps = {
  /** True when the user has a verified users.short_domain configured. Custom
   *  slugs are only resolvable via the custom-short-domain middleware path —
   *  for users on the default anch.to domain the field would be write-only.
   *  We gate the UI behind verified ownership to avoid that confusion and to
   *  prevent users from "reserving" a path on anch.to they don't actually own. */
  hasCustomShortDomain: boolean;
  /** Pro-tier user — unlocks the password field. */
  isPro: boolean;
  shortDomain: string;
  onCreated: (shortLink: ShortLinkItem, keepOpen: boolean) => void;
};

export const CreateShortLinkForm: React.FC<CreateShortLinkFormProps> = (props) => {
  const { hasCustomShortDomain, isPro, onCreated, shortDomain } = props;

  const customSlugAllowed = isPro && hasCustomShortDomain;

  //* State
  const { t } = useTranslation();
  const [url, setUrl] = React.useState("");
  const [customSlug, setCustomSlug] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showOptions, setShowOptions] = React.useState(false);
  const [showUtm, setShowUtm] = React.useState(false);
  const [utmSource, setUtmSource] = React.useState("");
  const [utmMedium, setUtmMedium] = React.useState("");
  const [utmCampaign, setUtmCampaign] = React.useState("");
  const [utmTerm, setUtmTerm] = React.useState("");
  const [utmContent, setUtmContent] = React.useState("");
  const [customParams, setCustomParams] = React.useState<CustomParam[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  //* Handlers
  const buildUrlWithUtm = (baseUrl: string) => {
    const params = new URLSearchParams();
    if (utmSource.length > 0) {
      params.set("utm_source", utmSource);
    }
    if (utmMedium.length > 0) {
      params.set("utm_medium", utmMedium);
    }
    if (utmCampaign.length > 0) {
      params.set("utm_campaign", utmCampaign);
    }
    if (utmTerm.length > 0) {
      params.set("utm_term", utmTerm);
    }
    if (utmContent.length > 0) {
      params.set("utm_content", utmContent);
    }
    for (const p of customParams) {
      if (p.key.length > 0 && p.value.length > 0) {
        params.set(p.key, p.value);
      }
    }

    if (params.toString().length === 0) {
      return baseUrl;
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${params.toString()}`;
  };

  const resetForm = () => {
    setUrl("");
    setCustomSlug("");
    setExpiresAt("");
    setPassword("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmTerm("");
    setUtmContent("");
    setCustomParams([]);
    setError(null);
  };

  const handleSubmit = async (keepOpen: boolean) => {
    setError(null);
    setLoading(true);

    try {
      const finalUrl = buildUrlWithUtm(url);
      const result = await createShortLinkAction({
        customSlug: customSlug.length > 0 ? customSlug : undefined,
        expiresAt: expiresAt.length > 0 ? new Date(expiresAt).toISOString() : undefined,
        password: password.length > 0 ? password : undefined,
        url: finalUrl,
      });

      if (result.success) {
        onCreated(result.shortLink, keepOpen);
        resetForm();
      } else {
        setError(t(result.error as TranslationKey));
      }
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleShortenClick = () => handleSubmit(false);

  const handleShortenAndAddAnotherClick = () => handleSubmit(true);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleToggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleCustomSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSlug(e.target.value.toLowerCase());
  };

  const handleExpiresAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiresAt(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleToggleUtm = () => {
    setShowUtm(!showUtm);
  };

  const handleUtmSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtmSource(e.target.value);
  };

  const handleUtmMediumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtmMedium(e.target.value);
  };

  const handleUtmCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtmCampaign(e.target.value);
  };

  const handleUtmTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtmTerm(e.target.value);
  };

  const handleUtmContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtmContent(e.target.value);
  };

  const handleAddCustomParam = () => {
    setCustomParams((prev) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }]);
  };

  const handleCustomParamKeyChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...customParams];
    updated[index] = { ...updated[index], key: e.target.value };
    setCustomParams(updated);
  };

  const handleCustomParamValueChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...customParams];
    updated[index] = { ...updated[index], value: e.target.value };
    setCustomParams(updated);
  };

  const handleRemoveCustomParam = (index: number) => () => {
    setCustomParams((prev) => prev.filter((_, j) => j !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="short-link-url">{t("destinationUrl")}</Label>
        <Input
          autoFocus
          id="short-link-url"
          onChange={handleUrlChange}
          placeholder="https://example.com/long-url"
          type="url"
          value={url}
        />
      </div>

      {/* Options */}
      <button
        className="text-muted-foreground hover:text-foreground text-sm font-medium"
        onClick={handleToggleOptions}
        type="button"
      >
        {showOptions ? "- " : "+ "}
        {t("options")}
      </button>

      {showOptions && (
        <div className="space-y-3 pl-2">
          <div>
            <Label htmlFor="custom-slug">
              {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- parentheses wrapping translated label */}
              {t("customShortUrl")} {!isPro && <span className="text-muted-foreground">({t("pro")})</span>}
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">{shortDomain}/</span>
              <Input
                className="flex-1"
                disabled={!customSlugAllowed}
                id="custom-slug"
                onChange={handleCustomSlugChange}
                placeholder="my-link"
                value={customSlug}
              />
            </div>
            {isPro && !hasCustomShortDomain && (
              <p className="text-muted-foreground mt-1 text-xs">
                {t("customPathsRequireAVerifiedShortDomainConfigureOneInSettings")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="expires-at">{t("expires")}</Label>
            <Input
              id="expires-at"
              min={new Date().toISOString().slice(0, 16)}
              onChange={handleExpiresAtChange}
              type="datetime-local"
              value={expiresAt}
            />
          </div>

          <div>
            <Label htmlFor="password">
              {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- parentheses wrapping translated label */}
              {t("password")} {!isPro && <span className="text-muted-foreground">({t("pro")})</span>}
            </Label>
            <Input
              disabled={!isPro}
              id="password"
              onChange={handlePasswordChange}
              placeholder={t("optionalPassword")}
              type="password"
              value={password}
            />
          </div>
        </div>
      )}

      {/* UTM Parameters */}
      {isPro && (
        <>
          <button
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
            onClick={handleToggleUtm}
            type="button"
          >
            {showUtm ? "- " : "+ "}
            {t("utmParameters")}
          </button>

          {showUtm && (
            <div className="space-y-3 pl-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="utm-source">{t("source")}</Label>
                  <Input id="utm-source" onChange={handleUtmSourceChange} placeholder="twitter" value={utmSource} />
                </div>
                <div>
                  <Label htmlFor="utm-medium">{t("medium")}</Label>
                  <Input id="utm-medium" onChange={handleUtmMediumChange} placeholder="social" value={utmMedium} />
                </div>
              </div>
              <div>
                <Label htmlFor="utm-campaign">{t("campaign")}</Label>
                <Input
                  id="utm-campaign"
                  onChange={handleUtmCampaignChange}
                  placeholder="spring_sale"
                  value={utmCampaign}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="utm-term">{t("term")}</Label>
                  <Input id="utm-term" onChange={handleUtmTermChange} placeholder="keyword" value={utmTerm} />
                </div>
                <div>
                  <Label htmlFor="utm-content">{t("content")}</Label>
                  <Input
                    id="utm-content"
                    onChange={handleUtmContentChange}
                    placeholder="banner_v2"
                    value={utmContent}
                  />
                </div>
              </div>

              {/* Custom params */}
              {customParams.map((p, i) => (
                <div className="flex items-center gap-2" key={p.id}>
                  <Input className="flex-1" onChange={handleCustomParamKeyChange(i)} placeholder="key" value={p.key} />
                  <Input
                    className="flex-1"
                    onChange={handleCustomParamValueChange(i)}
                    placeholder="value"
                    value={p.value}
                  />
                  <Button onClick={handleRemoveCustomParam(i)} size="sm" variant="tertiary">
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={handleAddCustomParam} size="sm" variant="secondary">
                {t("addCustomParameter")}
              </Button>
            </div>
          )}
        </>
      )}

      {error != null && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button disabled={loading || url.length === 0} onClick={handleShortenClick}>
          {loading ? t("shortening") : t("shorten")}
        </Button>
        <Button disabled={loading || url.length === 0} onClick={handleShortenAndAddAnotherClick} variant="secondary">
          {t("shortenAndAddAnother")}
        </Button>
      </div>
    </div>
  );
};
