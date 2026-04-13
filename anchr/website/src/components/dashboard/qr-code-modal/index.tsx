"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  buildAnchorSvgUrl,
  DEFAULT_QR_SIZE,
  downloadQrPng,
  LOGO_RATIO,
  QR_SIZES,
  QR_STYLE_COLORS,
  type QrLogoOption,
  type QrSize,
  type QrStyleOption,
} from "@/lib/qr";
import { Check, Copy, Download, Lock } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PREVIEW_LOGO_SIZE, PREVIEW_SIZE } from "./constants";
import { RoundedQrCanvas } from "./rounded-qr-canvas";

export type QrCodeModalProps = {
  avatarUrl: null | string;
  isPro: boolean;
  label: string;
  open: boolean;
  url: string;
  onOpenChange: (open: boolean) => void;
};

export const QrCodeModal: React.FC<QrCodeModalProps> = (props) => {
  const { avatarUrl, isPro, label, onOpenChange, open, url } = props;

  //* State
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = React.useState<QrSize>(DEFAULT_QR_SIZE);
  const [selectedLogo, setSelectedLogo] = React.useState<QrLogoOption>("anchor");
  const [selectedStyle, setSelectedStyle] = React.useState<QrStyleOption>("dark");
  const [copied, setCopied] = React.useState(false);

  //* Refs
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  //* Variables
  const { bg: qrBg, fg: qrFg } = QR_STYLE_COLORS[selectedStyle];

  const styleOptions: { label: string; value: QrStyleOption }[] = [
    { label: t("light"), value: "light" },
    { label: t("dark"), value: "dark" },
  ];

  const logoOptions: { label: string; proOnly: boolean; value: QrLogoOption }[] = [
    { label: t("anchor"), proOnly: false, value: "anchor" },
    ...(avatarUrl != null ? [{ label: t("avatar"), proOnly: true, value: "avatar" as const }] : []),
    { label: t("none"), proOnly: true, value: "none" },
  ];

  //* Handlers
  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("urlCopied"));
    if (copiedTimerRef.current != null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      return;
    }
    const filename = label.toLowerCase().replace(/\s+/g, "-");

    let logo: undefined | { circular?: boolean; src: string };
    if (selectedLogo === "anchor") {
      const logoSize = Math.round(selectedSize.px * LOGO_RATIO);
      logo = { src: buildAnchorSvgUrl(logoSize, selectedStyle) };
    } else if (selectedLogo === "avatar" && avatarUrl != null) {
      logo = { circular: true, src: avatarUrl };
    }

    try {
      await downloadQrPng(canvas, `${filename}-qr`, logo);
    } catch {
      toast.error(t("couldNotLoadAvatar"));
    }
  };

  //* Effects
  React.useEffect(() => {
    if (open) {
      setSelectedSize(DEFAULT_QR_SIZE);
      setSelectedLogo("anchor");
      setSelectedStyle("dark");
      setCopied(false);
    }
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current != null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("qrCode")}</DialogTitle>
          <DialogDescription className="sr-only">{label}</DialogDescription>
        </DialogHeader>

        {/* URL display with copy */}
        <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{url}</span>
          <button
            aria-label={t("copyRedirectUrl")}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            onClick={handleCopyUrl}
            type="button"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>

        {/* QR preview */}
        <div className="flex justify-center py-2">
          <div className="relative">
            <RoundedQrCanvas
              bgColor={qrBg}
              fgColor={qrFg}
              level="H"
              ref={canvasRef}
              size={selectedSize.px}
              // eslint-disable-next-line november-sierra/no-inline-style -- CSS-scale the canvas to a fixed display size
              style={{ height: PREVIEW_SIZE, width: PREVIEW_SIZE }}
              value={url}
            />
            {selectedLogo === "anchor" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  alt=""
                  src={buildAnchorSvgUrl(PREVIEW_LOGO_SIZE * 2, selectedStyle)}
                  // eslint-disable-next-line november-sierra/no-inline-style -- size must match LOGO_RATIO for download fidelity
                  style={{ height: PREVIEW_LOGO_SIZE, width: PREVIEW_LOGO_SIZE }}
                />
              </div>
            )}
            {selectedLogo === "avatar" && avatarUrl != null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  alt=""
                  className="rounded-full"
                  src={avatarUrl}
                  // eslint-disable-next-line november-sierra/no-inline-style -- size must match LOGO_RATIO for download fidelity
                  style={{ height: PREVIEW_LOGO_SIZE, width: PREVIEW_LOGO_SIZE }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Style picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-foreground text-sm font-medium">{t("style")}</span>
          <div className="flex items-center gap-1">
            {styleOptions.map((option) => {
              const isActive = selectedStyle === option.value;

              const handleButtonOnClick = () => setSelectedStyle(option.value);

              return (
                <button
                  className="text-muted-foreground data-[active=true]:bg-secondary data-[active=true]:text-foreground rounded-md px-2.5 py-1 text-sm transition-colors"
                  data-active={isActive}
                  key={option.value}
                  onClick={handleButtonOnClick}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logo picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-foreground text-sm font-medium">{t("centerLogo")}</span>
          <div className="flex items-center gap-1">
            {logoOptions.map((option) => {
              const isActive = selectedLogo === option.value;
              const isLocked = option.proOnly && !isPro;

              const handleButtonOnClick = () => setSelectedLogo(option.value);

              return (
                <button
                  className="text-muted-foreground data-[active=true]:bg-secondary data-[active=true]:text-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-sm transition-colors disabled:opacity-50"
                  data-active={isActive}
                  disabled={isLocked}
                  key={option.value}
                  onClick={handleButtonOnClick}
                  title={isLocked ? t("upgradeToPro") : undefined}
                  type="button"
                >
                  {option.label}
                  {isLocked && <Lock className="size-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-foreground text-sm font-medium">{t("size")}</span>
          <div className="flex items-center gap-1">
            {QR_SIZES.map((size) => {
              const isActive = selectedSize.px === size.px;

              const handleButtonOnClick = () => setSelectedSize(size);

              return (
                <button
                  className="text-muted-foreground data-[active=true]:bg-secondary data-[active=true]:text-foreground rounded-md px-2.5 py-1 text-sm transition-colors"
                  data-active={isActive}
                  key={size.label}
                  onClick={handleButtonOnClick}
                  type="button"
                >
                  {t("{{label}}{{px}}Px", { label: size.label, px: size.px })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Download button */}
        <Button onClick={handleDownload} type="button" variant="primary">
          <Download className="size-4" />
          {t("downloadPng")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
