"use client";
import { btnGhost } from "@/components/ui/Notice";

export function FilePicker({ label, accept = "image/jpeg,image/png,image/webp,image/avif,image/gif", multiple = false, onFiles, primary = false, disabled = false }: {
  label: string; accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; primary?: boolean; disabled?: boolean;
}) {
  const cls = primary
    ? "bg-paper text-ink px-6 py-3 text-[11px] tracking-[0.22em] uppercase hover:bg-gold transition-colors cursor-pointer"
    : `${btnGhost} cursor-pointer`;
  return (
    <label className={`${cls} ${disabled ? "pointer-events-none opacity-50" : ""} focus-within:outline focus-within:outline-2 focus-within:outline-gold`}>
      {label}
      <input type="file" className="sr-only" accept={accept} multiple={multiple} disabled={disabled}
        onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = ""; }} />
    </label>
  );
}

export function Progress({ pct, label = "Upload progress" }: { pct: number | null; label?: string }) {
  if (pct === null) return null;
  return (
    <div className="h-1 bg-line" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="h-1 bg-gold transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`inline-block px-2 py-1 text-[10px] tracking-[0.18em] uppercase border ${on ? "border-emerald-500/40 text-emerald-300" : "border-line text-mute"}`}>
      {on ? onText : offText}
    </span>
  );
}
