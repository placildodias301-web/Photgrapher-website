export type NoticeState = { kind: "success" | "error"; text: string } | null;
export default function Notice({ n }: { n: NoticeState }) {
  if (!n) return null;
  return (
    <p role={n.kind === "error" ? "alert" : "status"}
      className={`text-sm px-4 py-3 border ${n.kind === "error" ? "border-red-500/40 text-red-300 bg-red-500/5" : "border-emerald-500/40 text-emerald-300 bg-emerald-500/5"}`}>
      {n.kind === "success" ? "✓ " : ""}{n.text}
    </p>
  );
}
export const inputCls = "w-full bg-ink border border-line focus:border-gold px-4 py-3 text-sm outline-none transition-colors";
export const btnCls = "bg-paper text-ink px-6 py-3 text-[11px] tracking-[0.22em] uppercase hover:bg-gold transition-colors disabled:opacity-50";
export const btnGhost = "border border-line px-4 py-2 text-[11px] tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-colors disabled:opacity-40";
