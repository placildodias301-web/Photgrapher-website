import { NotificationsPage } from "@/components/dashboard/NotificationCenter";
export const metadata = { title: "Notifications" };
export default function Page() {
  return (<><h1 className="font-display text-4xl font-light mb-2">Notifications</h1>
    <p className="text-sm text-mute mb-10">New enquiries, replies, uploads and security alerts. Click one to open the related item.</p>
    <NotificationsPage /></>);
}
