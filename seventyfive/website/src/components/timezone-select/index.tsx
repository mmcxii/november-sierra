"use client";

import { browserTimeZone } from "@/lib/browser-timezone";
import { formatTimeZoneOption, timeZoneOptions } from "@/lib/timezones";
import * as React from "react";

export type TimeZoneSelectProps = {
  defaultValue?: string;
  id?: string;
  name?: string;
  value?: string;
  onValueChange?: (timeZone: string) => void;
};

export const TimeZoneSelect: React.FC<TimeZoneSelectProps> = (props) => {
  const { defaultValue, id = "timeZone", name = "timeZone", onValueChange, value } = props;

  //* Variables
  const isControlled = value != null;
  let selected = browserTimeZone();
  if (isControlled) {
    selected = value;
  } else if (defaultValue != null && defaultValue !== "") {
    selected = defaultValue;
  }
  const options = timeZoneOptions(selected);

  //* Handlers
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <select
      className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
      defaultValue={isControlled ? undefined : selected}
      id={id}
      name={name}
      onChange={handleChange}
      required
      value={isControlled ? selected : undefined}
    >
      {options.map((timeZone) => {
        return (
          <option key={timeZone} value={timeZone}>
            {formatTimeZoneOption(timeZone)}
          </option>
        );
      })}
    </select>
  );
};
