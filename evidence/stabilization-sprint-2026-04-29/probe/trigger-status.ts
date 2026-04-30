import { db } from "../../../server/db";
import { sql } from "drizzle-orm";

(async () => {
  const result = await db.execute(sql`
    SELECT
      o.name,
      o.slug,
      o.outbound_enabled AS ob,
      o.sms_enabled AS sms,
      (o.settings->>'triggersEnabled') AS trigs,
      (o.settings->>'afterHoursTriggerEnabled') AS afh,
      (o.settings->>'checkInTriggerEnabled') AS chk,
      (o.settings->>'immediateTriggerEnabled') AS imm,
      (o.settings->>'checkInDelayMinutes') AS dlay,
      (o.settings->'triggerTestPhones')::text AS phones,
      (o.settings->>'businessHoursStart') AS bhs,
      (o.settings->>'businessHoursEnd') AS bhe,
      (o.settings->>'timezone') AS tz,
      (o.settings->>'vinLeadSourceName') AS vinSrc
    FROM organizations o
    WHERE o.parent_organization_id IS NOT NULL
    ORDER BY o.name
  `);
  console.log("=== ORG TRIGGER POSTURE ===");
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
})();
