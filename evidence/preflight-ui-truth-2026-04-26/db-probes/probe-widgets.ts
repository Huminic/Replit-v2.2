/**
 * Read-only probe for Serra Honda widget identifiers needed by the audit.
 *
 * No mutations. Selects org id + per-widget slug/id/name.
 * Output goes to stdout; capture into evidence/preflight-ui-truth-2026-04-26/
 * db-probes/serra-honda-widgets.json for the audit deliverables.
 */
import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(2);
  }
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    const org = await pool.query<{ id: string; slug: string; name: string; outbound_enabled: boolean }>(
      "SELECT id, slug, name, outbound_enabled FROM organizations WHERE slug='serra-honda' LIMIT 1",
    );
    const widgets = await pool.query<{
      id: string;
      widget_code: string;
      name: string;
      type: string;
      status: string;
      config: unknown;
    }>(
      "SELECT id, widget_code, name, type, status, config FROM widgets WHERE organization_id = $1 ORDER BY created_at",
      [org.rows[0]?.id],
    );
    const out = {
      org: org.rows[0] ?? null,
      widgets: widgets.rows,
    };
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
