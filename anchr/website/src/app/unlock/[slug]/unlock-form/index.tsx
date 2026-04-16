"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import * as React from "react";
import { verifyShortLinkPassword } from "../actions";

type UnlockFormProps = {
  slug: string;
};

export const UnlockForm: React.FC<UnlockFormProps> = (props) => {
  const { slug } = props;

  //* State
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<null | string>(null);
  const [loading, setLoading] = React.useState(false);

  //* Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyShortLinkPassword(slug, password);

      if (result.success) {
        window.location.href = result.url;
        return;
      }

      switch (result.error) {
        case "expired":
          setError("This link has expired.");
          break;
        case "incorrectPassword":
          setError("Incorrect password. Please try again.");
          break;
        case "notFound":
          setError("This link no longer exists.");
          break;
        case "rateLimited":
          setError("Too many attempts. Please try again later.");
          break;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative">
        <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          autoFocus
          className="pl-10"
          disabled={loading}
          onChange={handleInputChange}
          placeholder="Enter password"
          type="password"
          value={password}
        />
      </div>
      {error != null && <p className="text-destructive text-sm">{error}</p>}
      <Button className="w-full" disabled={loading || password.length === 0} type="submit">
        {loading ? "Unlocking..." : "Unlock"}
      </Button>
    </form>
  );
};
