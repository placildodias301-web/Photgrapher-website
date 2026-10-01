import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import mysql, { type RowDataPacket } from "mysql2/promise";

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || "pascoal";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME || "Pascoal Joel Fernandes";

  if (!password || password.length < 10) {
    console.error("Set SEED_ADMIN_PASSWORD (min 10 characters) in .env.local first.");
    process.exit(1);
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pascoal_photography",
  });

  const [rows] = await db.query<RowDataPacket[]>("SELECT id FROM users WHERE username = ?", [username]);
  if (rows.length) {
    console.log(`User "${username}" already exists — nothing to do.`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    // recovery_email intentionally NULL: no email has been supplied yet.
    await db.query(
      "INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)",
      [username, displayName, hash]
    );
    console.log(`Created admin user "${username}".`);
  }
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
