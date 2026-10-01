/** Where "open related item" should go for a notification. */
export function notificationHref(n: { type: string; related_type: string | null; related_id: number | null }): string | null {
  if (n.related_type === "enquiry" && n.related_id) return `/dashboard/enquiries/${n.related_id}`;
  if (n.related_type === "shoot" && n.related_id) return `/dashboard/content/shoots/${n.related_id}`;
  if (n.related_type === "album" && n.related_id) return `/dashboard/content/albums/${n.related_id}`;
  if (n.related_type === "film") return `/dashboard/content/films`;
  switch (n.type) {
    case "HERO_CHANGED": return "/dashboard/homepage/hero";
    case "LOGO_CHANGED": case "WEBSITE_NAME_CHANGED": case "SETTINGS_CHANGED": return "/dashboard/website/branding";
    case "PASSWORD_CHANGED": case "USERNAME_CHANGED": case "RECOVERY_EMAIL_CHANGED": case "NEW_LOGIN": return "/dashboard/settings/account";
    case "UPLOAD_FAILED": return "/dashboard/media";
    case "VIDEO_UPLOADED": return "/dashboard/content/films";
    default: return null;
  }
}
