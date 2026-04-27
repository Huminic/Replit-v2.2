/**
 * Read-only check: did serra-honda's org settings change during the
 * 2026-04-12 / 2026-04-13 SMS window? Specifically business-hours and
 * sms_enabled / outbound_enabled toggles.
 */
import "dotenv/config";
import pg from "pg";

const SERRA_HONDA = "24d64f99-ba04-4b43-af35-fd06f555ac86";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // organization_updated activity_log entries for serra-honda.
    const orgUpdatesRes = await pool.query(
      `
      SELECT id, user_id, organization_id, action, entity_type, entity_id,
             metadata, created_at
      FROM activity_log
      WHERE entity_type = 'organization'
        AND entity_id = $1
        AND created_at >= '2026-04-01'::timestamp
        AND created_at <  '2026-04-15'::timestamp
      ORDER BY created_at ASC
      `,
      [SERRA_HONDA],
    );

    // All trigger_after_hours_* activity_log entries during the SMS window.
    const triggerLogsRes = await pool.query(
      `
      SELECT id, action, entity_type, entity_id, metadata, created_at
      FROM activity_log
      WHERE organization_id = $1
        AND action LIKE 'trigger_%'
        AND created_at >= '2026-04-12 23:00:00'::timestamp
        AND created_at <  '2026-04-13 03:00:00'::timestamp
      ORDER BY created_at ASC
      LIMIT 50
      `,
      [SERRA_HONDA],
    );

    console.log(JSON.stringify({
      probed_at: new Date().toISOString(),
      organization_updates_2026_04_01_to_04_15: orgUpdatesRes.rows,
      trigger_activity_during_sms_window: triggerLogsRes.rows,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
