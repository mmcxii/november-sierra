import * as React from "react";

export type DayQuoteProps = {
  author: string;
  text: string;
};

export const DayQuote: React.FC<DayQuoteProps> = (props) => {
  const { author, text } = props;

  return (
    <p className="text-sf-muted mt-10 max-w-xl text-xs leading-relaxed">
      {text}
      <span>{` — ${author}`}</span>
    </p>
  );
};
