import { query } from "@/lib/db";

/** Record an entry in the admin activity log. */
export async function logActivity(action: string, description: string) {
  await query(`INSERT INTO activity_logs (action, description) VALUES (?, ?)`, [
    action,
    description,
  ]);
}

/** Create a dashboard notification (shown under the 🔔 bell). */
export async function notify(params: {
  type: string;
  title: string;
  body?: string;
  relatedType?: string;
  relatedId?: number;
}) {
  await query(
    `INSERT INTO notifications (type, title, body, related_type, related_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.type,
      params.title,
      params.body ?? null,
      params.relatedType ?? null,
      params.relatedId ?? null,
    ]
  );
}
