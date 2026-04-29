/**
 * STEP 0 — schema reconnaissance for the orphan-conversations archaeology.
 *
 * Read-only. Reports:
 *   1. All columns on the live `conversations` table (so we know what
 *      message_count / type / etc. fields actually exist beyond what
 *      shared/schema.ts declares).
 *   2. All foreign keys referencing conversations.id in either direction
 *      (live DB pg_constraint scan — catches any migration-added FKs that
 *      shared/schema.ts doesn't model).
 *   3. Top-level shape of the messages, tasks, appointments,
 *      campaign_recipients tables for cascade-impact reasoning.
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, "schema-recon.json");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. conversations columns.
    const convCols = await pool.query(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conversations'
      ORDER BY ordinal_position
      `,
    );

    // 2. Every FK in either direction. Outbound: conversations.X → other.
    //    Inbound: other.X → conversations.id.
    const fks = await pool.query(
      `
      SELECT
        tc.table_name      AS source_table,
        kcu.column_name    AS source_column,
        ccu.table_name     AS target_table,
        ccu.column_name    AS target_column,
        rc.delete_rule     AS on_delete,
        rc.update_rule     AS on_update,
        tc.constraint_name AS constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND (ccu.table_name = 'conversations' OR tc.table_name = 'conversations')
      ORDER BY tc.table_name, kcu.column_name
      `,
    );

    // 3. Brief shape of related tables (just the columns that look relevant).
    const relCols = await pool.query(
      `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('messages', 'tasks', 'appointments', 'campaign_recipients', 'outbound_log', 'leads')
      ORDER BY table_name, ordinal_position
      `,
    );

    // 4. Look for any column literally named conversation_id in any table —
    //    catches soft-FK columns the schema doesn't model formally.
    const softRefs = await pool.query(
      `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('conversation_id', 'source_conversation_id', 'related_conversation_id')
      ORDER BY table_name, column_name
      `,
    );

    const out = {
      probed_at: new Date().toISOString(),
      conversations_columns: convCols.rows,
      foreign_keys_touching_conversations: fks.rows,
      related_tables_columns: relCols.rows.reduce(
        (acc: Record<string, any[]>, r: any) => {
          (acc[r.table_name] ||= []).push({
            column: r.column_name,
            type: r.data_type,
            nullable: r.is_nullable,
          });
          return acc;
        },
        {},
      ),
      soft_conversation_id_columns: softRefs.rows,
    };
    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
