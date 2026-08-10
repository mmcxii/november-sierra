"use client";

import { browserTimeZone } from "@/lib/browser-timezone";
import { formatTimeZoneOption, timeZoneOptions } from "@/lib/timezones";
import * as React from "react";

export type TimeZoneSelectProps = {
  defaultValue?: string;
  id?: string;
  name?: string;
};

export const TimeZoneSelect: React.FC<TimeZoneSelectProps> = (props) => {
  const { defaultValue, id = "timeZone", name = "timeZone" } = props;

  //* Variables
  const selected = defaultValue != null && defaultValue !== "" ? defaultValue : browserTimeZone();
  const options = timeZoneOptions(selected);

  return (
    <select
      className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
      defaultValue={selected}
      id={id}
      name={name}
      required
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
