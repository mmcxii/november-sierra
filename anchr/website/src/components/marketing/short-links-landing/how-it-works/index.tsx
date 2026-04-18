import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import { STEPS } from "./constants";

export type HowItWorksProps = {
  t: TFunction;
};

/**
 * Three-step "How it works" section on /short-links. Sits between the hero
 * and the features grid. Staccato verb headings (Create / Customize / Track)
 * with one concrete sentence beneath each. Anchor-linked from the hero's
 * "See how it works" secondary CTA.
 */
export const HowItWorks: React.FC<HowItWorksProps> = (props) => {
  const { t } = props;

  return (
    <Container as="section" className="py-16" id="how-it-works">
      <div className="mx-auto max-w-4xl">
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li className="m-card-bg-bg m-card-border relative flex flex-col gap-3 rounded-2xl p-6" key={step.heading}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <span className="m-muted-40 font-mono text-xs">
                { }
                {"0"}
                {index + 1}
              </span>
              <h3 className="text-xl font-bold tracking-tight">{t(step.heading)}</h3>
              <p className="m-muted-70 text-sm leading-relaxed">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  );
};
