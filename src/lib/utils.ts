const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function withBase(path: string): string {
  if (path.startsWith("http") || path.startsWith("mailto:")) return path;
  if (path.startsWith("#")) return path;
  if (!path.startsWith("/")) return `${BASE}/${path}`;
  return `${BASE}${path}`;
}
