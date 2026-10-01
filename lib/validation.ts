import { z } from "zod";

/** Link target: a site path ("/portfolio") or a full http(s) URL. Blocks javascript: and friends. */
export const linkTarget = z.string().trim().min(1, "Enter where it should link to.").max(500)
  .refine((v) => /^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(v) || /^https?:\/\/[^\s]+$/i.test(v), "Use a page like /portfolio or a full link starting with https://");

export const httpUrl = z.string().trim().max(500).refine((v) => /^https?:\/\/[^\s]+$/i.test(v), "Enter a full link starting with https://");

export const navSchema = z.object({
  label: z.string().trim().min(1, "Enter a menu name.").max(60),
  href: linkTarget,
  visible: z.boolean().optional(),
});

/** Strip control characters and normalise whitespace in free text from visitors. */
export function cleanText(s: string, max: number): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

export const socialSchema = z.object({
  platform_name: z.string().trim().min(1, "Enter the platform name.").max(60),
  url: httpUrl,
  username: z.string().trim().max(120).nullable().optional(),
  icon: z.string().trim().max(60).nullable().optional(),
  enabled: z.boolean().optional(),
});
