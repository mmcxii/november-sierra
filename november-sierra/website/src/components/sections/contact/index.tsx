"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";
import { TOPIC_KEYS } from "@/lib/constants";
import { CheckCircle, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

type FormState = "error" | "idle" | "submitting" | "success";

export const Contact: React.FC = () => {
  //* State
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const { t } = useTranslation();

  //* Refs
  const ref = useSectionReveal();

  //* Handlers
  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormState("submitting");
      setErrorMessage("");

      const formData = new FormData(event.currentTarget);
      const body = {
        email: formData.get("email") as string,
        message: formData.get("message") as string,
        name: formData.get("name") as string,
        topic: formData.get("topic") as string,
      };

      try {
        const response = await fetch("/api/contact", {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        setFormState("success");
      } catch {
        setFormState("error");
        setErrorMessage(t("somethingWentWrongPleaseTryAgain"));
      }
    },
    [t],
  );

  if (formState === "success") {
    return (
      <section className="px-6 py-24 md:px-12" id="contact">
        <div className="section-reveal mx-auto max-w-xl text-center" ref={ref}>
          <div className="border-ns-card-border bg-ns-card-bg flex flex-col items-center gap-4 rounded-lg border p-12">
            <CheckCircle aria-hidden="true" className="text-ns-accent animate-[fadeIn_0.5s_ease]" size={48} />
            <h2 className="text-ns-text-heading font-serif text-2xl">{t("messageSent")}</h2>
            <p className="text-ns-text">{t("thanksForReachingOutWellGetBackToYouSoon")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-24 md:px-12" id="contact">
      <div className="section-reveal mx-auto max-w-xl" ref={ref}>
        <h2 className="text-ns-text-heading mb-4 text-center font-serif text-3xl md:text-4xl">{t("getInTouch")}</h2>
        <p className="text-ns-text-muted mb-10 text-center text-lg">{t("haveAQuestionOrWantToWorkTogetherReachOut")}</p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="name">
              {t("name")}
            </label>
            <input
              autoComplete="name"
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text placeholder:text-ns-input-placeholder rounded-md border px-4 py-2.5 text-base transition-colors"
              id="name"
              name="name"
              placeholder={t("yourName")}
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="email">
              {t("email")}
            </label>
            <input
              autoComplete="email"
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text placeholder:text-ns-input-placeholder rounded-md border px-4 py-2.5 text-base transition-colors"
              id="email"
              name="email"
              placeholder={t("youExampleCom")}
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="topic">
              {t("whatsThisAbout")}
            </label>
            <select
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text rounded-md border px-4 py-2.5 text-base transition-colors"
              id="topic"
              name="topic"
              required
            >
              <option value="">{t("selectATopic")}</option>
              {TOPIC_KEYS.map((key) => {
                return (
                  <option key={key} value={t(key)}>
                    {t(key)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ns-text text-sm font-medium" htmlFor="message">
              {t("message")}
            </label>
            <textarea
              className="border-ns-input-border bg-ns-input-bg text-ns-input-text placeholder:text-ns-input-placeholder resize-none rounded-md border px-4 py-2.5 text-base transition-colors"
              id="message"
              name="message"
              placeholder={t("yourMessage")}
              required
              rows={5}
            />
          </div>

          {formState === "error" && (
            <p className="text-ns-error text-sm" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="btn-primary bg-ns-btn-bg text-ns-btn-text mt-2 flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-medium transition-colors duration-200 disabled:opacity-60"
            disabled={formState === "submitting"}
            type="submit"
          >
            {formState === "submitting" ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                {t("sending")}
              </>
            ) : (
              t("sendMessage")
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
