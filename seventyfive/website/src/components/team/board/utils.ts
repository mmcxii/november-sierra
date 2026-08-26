const SCROLL_TOP_EPSILON_PX = 1;
const SMOOTH_SCROLL_TIMEOUT_MS = 600;

/** Scroll the window to the top so the progress ember is on-screen before day-complete motion. */
export function scrollWindowToTop(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || window.scrollY <= SCROLL_TOP_EPSILON_PX) {
      resolve();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      window.scrollTo(0, 0);
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener("scrollend", finish);
      window.clearTimeout(timeoutId);
      resolve();
    };

    window.addEventListener("scrollend", finish, { once: true });
    const timeoutId = window.setTimeout(finish, SMOOTH_SCROLL_TIMEOUT_MS);
    window.scrollTo({ behavior: "smooth", top: 0 });
  });
}
