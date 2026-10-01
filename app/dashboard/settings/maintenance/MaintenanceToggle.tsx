"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, btnCls } from "@/components/ui/Notice";

export default function MaintenanceToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial); const [busy, setBusy] = useState(false); const [n, setN] = useState<NoticeState>(null);
  async function flip() {
    setBusy(true); setN(null);
    const r = await api("/api/maintenance", "PUT", { enabled: !on }); setBusy(false);
    if (r.ok) { setOn(!on); setN({ kind: "success", text: !on ? "Maintenance mode is ON. Visitors see the “back soon” page." : "Maintenance mode is OFF. Your website is live." }); router.refresh(); }
    else setN({ kind: "error", text: r.data.error || "Couldn’t change it." });
  }
  return (
    <div className="space-y-6 max-w-xl">
      <p className="flex items-center gap-3 text-lg"><span className={`inline-block h-3 w-3 rounded-full ${on ? "bg-amber-400" : "bg-emerald-400"}`} />{on ? "Maintenance mode is ON" : "Website is online"}</p>
      <button onClick={flip} disabled={busy} className={btnCls}>{busy ? "Working…" : on ? "Turn off — go live" : "Turn on"}</button>
      <Notice n={n} />
    </div>
  );
}
