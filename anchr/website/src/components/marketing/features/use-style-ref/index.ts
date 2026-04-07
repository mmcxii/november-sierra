import * as React from "react";

/** Sets multiple CSS properties on an element via a ref callback. */
export function useStyleRef(styles: Record<string, string>): React.RefCallback<HTMLElement> {
  const serialized = JSON.stringify(styles);
  return React.useCallback(
    (el: null | HTMLElement) => {
      if (el == null) {
        return;
      }
      for (const [prop, value] of Object.entries(styles)) {
        el.style.setProperty(prop, value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialized],
  );
}
