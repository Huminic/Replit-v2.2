// ═══════════════════════════════════════════════════════════════════════════════
// ADF/XML Lead Submission Functions
// ═══════════════════════════════════════════════════════════════════════════════
//
// ADF (Auto-lead Data Format) email config is stored per-organization:
//   org.settings.adfEmail  — the dealer's ADF intake email (e.g. leads@serrahonda.co)
//   org.settings.adfBrand  — the dealer's primary brand (e.g. "Honda", "Ford")
//
// These values come from the database via storage.getOrganization(). No
// hardcoded dealer map is needed here.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Escape special XML characters to prevent malformed output.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a phone number for ADF XML: strip +1 prefix, format as XXX-XXX-XXXX.
 */
function formatPhoneForAdf(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const cleaned = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

/**
 * Build an ADF 1.0 XML document from structured lead data.
 * Pure function — no side effects, no API calls.
 */
function buildAdfXml(params: {
  leadId: string;
  leadSource: string;
  requestDate: string; // ISO 8601
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  comments: string;
  dealerName: string;
}): string {
  const firstName = escapeXml(params.customerFirstName);
  const lastName = escapeXml(params.customerLastName);
  const dealerName = escapeXml(params.dealerName);
  const comments = escapeXml(params.comments);
  const leadId = escapeXml(params.leadId);
  const leadSource = escapeXml(params.leadSource);
  const vehicleYear = escapeXml(params.vehicleYear);
  const vehicleMake = escapeXml(params.vehicleMake);
  const vehicleModel = escapeXml(params.vehicleModel);
  const requestDate = escapeXml(params.requestDate);

  // Phone tag — format if provided
  const phoneTag = params.customerPhone
    ? `\n        <phone type="cellphone">${escapeXml(formatPhoneForAdf(params.customerPhone))}</phone>`
    : '';

  // Email tag — only if provided and non-empty
  const emailTag = params.customerEmail && params.customerEmail.trim()
    ? `\n        <email>${escapeXml(params.customerEmail.trim())}</email>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="new">
    <id sequence="${leadId}" source="${leadSource}"/>
    <requestdate>${requestDate}</requestdate>
    <vehicle interest="buy" status="new">
      <year>${vehicleYear}</year>
      <make>${vehicleMake}</make>
      <model>${vehicleModel}</model>
    </vehicle>
    <customer>
      <contact>
        <name part="first" type="individual">${firstName}</name>
        <name part="last" type="individual">${lastName}</name>${phoneTag}${emailTag}
      </contact>
      <comments>${comments}</comments>
    </customer>
    <vendor>
      <vendorname>${dealerName}</vendorname>
      <contact>
        <name part="full">${dealerName}</name>
      </contact>
    </vendor>
    <provider>
      <name part="full">Nexxus Connect</name>
      <service>AI Voice Agent</service>
    </provider>
  </prospect>
</adf>`;
}

/**
 * Submit an ADF/XML lead for a given organization.
 *
 * Looks up org config (adfEmail, adfBrand), builds the XML, and either
 * logs it, sends to a test address, or sends to the real ADF email —
 * controlled by the ADF_MODE env var (log | test | live).
 *
 * Does NOT modify any webhook handlers — call this explicitly when ready.
 */
async function submitAdfLead(
  organizationId: string,
  leadData: {
    customerName: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    transcript?: string | null;
    summary?: string | null;
    callId: string;
    callTimestamp: string; // ISO 8601
    source: 'vapi' | 'tavus';
  }
): Promise<{ sent: boolean; mode: string; xml: string; targetEmail: string }> {
  // 1. Look up org from storage
  const org = await storage.getOrganization(organizationId);
  if (!org) {
    console.warn(`[ADF] Organization not found: ${organizationId}`);
    return { sent: false, mode: 'no-org', xml: '', targetEmail: '' };
  }

  const settings = (org.settings as Record<string, any>) || {};
  const adfEmail: string | undefined = settings.adfEmail;
  const adfBrand: string | undefined = settings.adfBrand;

  // 2. If no ADF email configured, nothing to do
  if (!adfEmail) {
    console.log(`[ADF] No adfEmail configured for org=${org.name} (${organizationId})`);
    return { sent: false, mode: 'no-config', xml: '', targetEmail: '' };
  }

  // 3. Parse customer name into first/last
  const nameParts = (leadData.customerName || '').trim().split(/\s+/);
  let firstName = nameParts[0] || '';
  let lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  // Apply generic fallbacks per spec
  if (!firstName) firstName = 'Phone';
  if (!lastName) lastName = 'Inquiry';

  // 4. Vehicle defaults — current year, org brand, "General Inquiry"
  const currentYear = new Date().getFullYear().toString();
  const vehicleYear = currentYear;
  const vehicleMake = adfBrand || 'Unknown';
  const vehicleModel = 'General Inquiry';

  // 5. Comments — use summary/transcript or fallback
  let comments: string;
  if (leadData.summary && leadData.summary.trim()) {
    comments = leadData.summary.trim();
  } else if (leadData.transcript && leadData.transcript.trim()) {
    // Truncate transcript if very long
    const t = leadData.transcript.trim();
    comments = t.length > 2000 ? t.slice(0, 2000) + '...' : t;
  } else {
    const dealerName = org.name || 'the dealership';
    comments = `This was a real inbound sales call and should be returned. Suggested follow-up: "Good day, I'm calling from ${dealerName}. Someone called in and I wanted to check if you were looking for a new vehicle or wanted to schedule a test drive."`;
  }

  // 6. Build the XML
  const xml = buildAdfXml({
    leadId: leadData.callId,
    leadSource: 'Nexxus Connect',
    requestDate: leadData.callTimestamp,
    customerFirstName: firstName,
    customerLastName: lastName,
    customerPhone: leadData.customerPhone,
    customerEmail: leadData.customerEmail,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    comments,
    dealerName: org.name || 'Unknown Dealer',
  });

  // 7. Determine mode and target email
  const adfMode = (process.env.ADF_MODE || 'live').toLowerCase();
  let targetEmail: string;
  let mode: string;

  if (adfMode === 'log') {
    mode = 'log';
    targetEmail = adfEmail; // show what WOULD be used, but don't send
    console.log(`[ADF] LOG-ONLY mode — XML generated but NOT sent`);
    console.log(`[ADF] mode=${mode} org=${org.name} to=${targetEmail} phone=${leadData.customerPhone || 'none'}`);
    console.log(`[ADF] XML:\n${xml}`);
    return { sent: false, mode, xml, targetEmail };
  } else if (adfMode === 'test') {
    targetEmail = process.env.ADF_TEST_EMAIL || '';
    mode = 'test';
    if (!targetEmail) {
      console.warn(`[ADF] TEST mode but ADF_TEST_EMAIL not set — cannot send`);
      return { sent: false, mode: 'test-no-email', xml, targetEmail: '' };
    }
  } else {
    // live mode (default)
    targetEmail = adfEmail;
    mode = 'live';
  }

  // 8. Send via Resend through callMCP
  try {
    await callMCP('resend_send_email', {
      from: 'Nexxus Connect <leads@huminic.ai>',
      to: targetEmail,
      subject: `New Lead - ${firstName} ${lastName}`,
      html: xml,
    });

    console.log(`[ADF] mode=${mode} org=${org.name} to=${targetEmail} phone=${leadData.customerPhone || 'none'} — SENT`);
    return { sent: true, mode, xml, targetEmail };
  } catch (err) {
    console.error(`[ADF] Failed to send ADF email:`, err);
    return { sent: false, mode: `${mode}-error`, xml, targetEmail };
  }
}
