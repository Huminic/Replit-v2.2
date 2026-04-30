SELECT
  o.id,
  o.name,
  o.slug,
  o.outbound_enabled,
  o.sms_enabled,
  (o.settings->>'triggersEnabled')::text AS triggers_enabled,
  (o.settings->>'afterHoursTriggerEnabled')::text AS after_hours,
  (o.settings->>'checkInTriggerEnabled')::text AS check_in,
  (o.settings->>'immediateTriggerEnabled')::text AS immediate,
  (o.settings->>'checkInDelayMinutes')::text AS checkin_delay,
  (o.settings->'triggerTestPhones')::text AS test_phones,
  (o.settings->>'businessHoursStart')::text AS bh_start,
  (o.settings->>'businessHoursEnd')::text AS bh_end,
  (o.settings->>'timezone')::text AS tz,
  (o.settings->>'vinLeadSourceName')::text AS vin_source
FROM organizations o
WHERE o.parent_organization_id IS NOT NULL
ORDER BY o.name;
