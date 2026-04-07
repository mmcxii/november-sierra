export const STORAGE_KEY = "cookie-consent";

export function getSnapshot(): null | string {
  return localStorage.getItem(STORAGE_KEY);
}

export function getServerSnapshot(): null | string {
  return "pending";
}

export function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
