import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sanitizeUrl(url) {
  if (!url) return '';
  const sanitized = url.toString().trim();
  if (sanitized.toLowerCase().startsWith('javascript:')) {
    return 'about:blank';
  }
  return sanitized;
}
