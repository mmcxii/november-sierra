"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy, X } from "lucide-react";
import * as React from "react";

type SuccessToastProps = {
  id: string;
  shortUrl: string;
  onDismiss: (id: string) => void;
};

export const SuccessToast: React.FC<SuccessToastProps> = (props) => {
  const { id, onDismiss, shortUrl } = props;

  //* State
  const [copied, setCopied] = React.useState(false);

  //* Handlers
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    onDismiss(id);
  };

  return (
    <div
      className="bg-muted flex items-center justify-between rounded-md px-4 py-3"
      data-testid="short-link-success-toast"
    >
      <div className="flex items-center gap-2">
        <Check className="text-primary size-4" />
        <span className="font-mono text-sm">{shortUrl}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button onClick={handleCopy} size="sm" variant="tertiary">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button onClick={handleDismiss} size="sm" variant="tertiary">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};
