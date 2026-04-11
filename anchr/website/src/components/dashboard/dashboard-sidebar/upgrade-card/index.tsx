"use client";

import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/lib/use-stripe-checkout";
import { Anchor, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const SidebarUpgradeCard: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const { loading, startCheckout } = useStripeCheckout();

  return (
    <div className="border-sidebar-border/60 bg-sidebar-accent/40 mx-3 mb-3 flex flex-col gap-2 rounded-md border p-3">
      <div className="text-sidebar-foreground flex items-center gap-1.5 text-xs font-medium">
        <Anchor className="text-primary size-3.5" />
        {t("unlockMoreWithPro")}
      </div>
      <Button disabled={loading} onClick={startCheckout} size="sm">
        {loading && <Loader2 className="size-3.5 animate-spin" />}
        {t("upgradeToPro")}
      </Button>
    </div>
  );
};
