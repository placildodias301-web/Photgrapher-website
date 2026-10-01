export const STATUSES = ["new", "viewed", "replied", "customer_replied", "follow_up", "confirmed", "completed", "cancelled"] as const;
export type EnquiryStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New", viewed: "Viewed", replied: "Replied", customer_replied: "Customer replied",
  follow_up: "Follow-up", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled",
};
export const STATUS_TONE: Record<EnquiryStatus, string> = {
  new: "border-gold text-gold", viewed: "border-line text-mute", replied: "border-emerald-500/40 text-emerald-300",
  customer_replied: "border-sky-400/50 text-sky-300", follow_up: "border-amber-400/50 text-amber-300",
  confirmed: "border-emerald-500/40 text-emerald-300", completed: "border-line text-mute", cancelled: "border-red-400/40 text-red-300",
};
