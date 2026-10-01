import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import AccountForms from "./AccountForms";
export const dynamic = "force-dynamic";
export const metadata = { title: "Account & Security" };
export default async function Page() {
  const u = (await getSessionUser())!;
  const row = await queryOne<{ recovery_email: string | null }>(`SELECT recovery_email FROM users WHERE id=?`, [u.id]);
  return (<><h1 className="font-display text-4xl font-light mb-2">Account &amp; Security</h1>
    <p className="text-sm text-mute mb-10">You sign in with your username and password. The recovery email is only used if you ever need to reset your password.</p>
    <AccountForms username={u.username} displayName={u.display_name} recoveryEmail={row?.recovery_email ?? ""} /></>);
}
