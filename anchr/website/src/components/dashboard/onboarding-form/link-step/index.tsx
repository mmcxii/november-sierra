import type { ConfirmImportResult, ImportResultData } from "@/app/(dashboard)/dashboard/import-actions";
import { addFirstLink } from "@/app/onboarding/actions";
import { ImportLinks } from "@/components/dashboard/import-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureProtocol } from "@/lib/utils/url";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type LinkStepProps = {
  onComplete: (importResult?: ImportResultData) => void;
  onSkip: () => void;
};

export const LinkStep: React.FC<LinkStepProps> = (props) => {
  const { onComplete, onSkip } = props;

  //* State
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<"import" | "manual">("manual");
  const [submitting, setSubmitting] = React.useState(false);
  const [linkTitle, setLinkTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkError, setLinkError] = React.useState<null | string>(null);

  //* Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError(t("somethingWentWrongPleaseTryAgain"));
      return;
    }

    const url = ensureProtocol(linkUrl);

    setSubmitting(true);
    const result = await addFirstLink(linkTitle.trim(), url);
    setSubmitting(false);

    if (result.success != null) {
      onComplete();
    } else {
      setLinkError(t("somethingWentWrongPleaseTryAgain"));
    }
  };

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setLinkTitle(e.target.value);

  const handleUrlInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value);

  const handleImportComplete = (result: ConfirmImportResult & { success: true }) => {
    onComplete(result);
  };

  const handleSwitchToManual = () => setMode("manual");

  const handleSwitchToImport = () => setMode("import");

  //* Render

  if (mode === "import") {
    return (
      <>
        <div className="flex flex-col items-center gap-2 text-center">
          <Download className="text-muted-foreground size-8" />
          <h1 className="text-2xl font-semibold tracking-tight">{t("importYourLinks")}</h1>
          <p className="text-muted-foreground text-sm">{t("switchingFromAnotherPlatformImportYourLinks")}</p>
        </div>

        <ImportLinks onComplete={handleImportComplete} />

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleSwitchToManual} type="button" variant="tertiary">
            {t("addYourFirstLink")}
          </Button>
          <Button className="w-full" disabled={submitting} onClick={onSkip} type="button" variant="tertiary">
            {t("skip")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <ExternalLink className="text-muted-foreground size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">{t("addYourFirstLink")}</h1>
        <p className="text-muted-foreground text-sm">{t("whatShouldVisitorsSeeFirst")}</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkTitle">{t("title")}</Label>
            <Input
              autoFocus
              disabled={submitting}
              id="linkTitle"
              onChange={handleInputOnChange}
              placeholder="My Website"
              value={linkTitle}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkUrl">{t("url")}</Label>
            <Input
              disabled={submitting}
              id="linkUrl"
              onChange={handleUrlInputOnChange}
              placeholder="https://"
              value={linkUrl}
            />
          </div>
        </div>

        {linkError != null && <p className="text-destructive text-center text-xs">{linkError}</p>}

        <div className="flex flex-col gap-2">
          <Button className="w-full" disabled={submitting || !linkTitle.trim() || !linkUrl.trim()} type="submit">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
          <Button className="w-full" onClick={handleSwitchToImport} type="button" variant="tertiary">
            <Download className="size-4" />
            {t("importFromAnotherPlatform")}
          </Button>
          <Button className="w-full" disabled={submitting} onClick={onSkip} type="button" variant="tertiary">
            {t("skip")}
          </Button>
        </div>
      </form>
    </>
  );
};
