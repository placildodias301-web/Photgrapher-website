import { getSiteSettings } from "@/lib/settings";
import MaintenanceToggle from "./MaintenanceToggle";
export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance Mode" };
export default async function Page() {
  const s = await getSiteSettings();
  return (<><h1 className="font-display text-4xl font-light mb-2">Maintenance Mode</h1>
    <p className="text-sm text-mute mb-10 max-w-xl">Turn this on while you’re making big changes. Visitors see a “back soon” page; you can still use the dashboard and see the real site while signed in.</p>
    <MaintenanceToggle initial={!!s.maintenance_mode} /></>);
}
