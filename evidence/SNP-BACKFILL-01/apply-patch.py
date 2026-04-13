#!/usr/bin/env python3
"""
Line-based patch for server/storage.ts — replaces lines 952-1008
Sprint: SNP-BACKFILL-01
"""

filepath = '/home/ubuntu/Claude-store/nexxus2.2_replit/server/storage.ts'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find the exact line boundaries (0-indexed)
# Line 952 in 1-indexed = "        return rows.map(row => {"
# Line 1008 in 1-indexed = "        });"

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '        return rows.map(row => {' in line and start_line is None and i > 940:
        start_line = i
    # The closing of the return statement: "        });" after the map
    if start_line is not None and end_line is None:
        stripped = line.strip()
        if stripped == '});' and i > start_line + 10:
            end_line = i
            break

if start_line is None or end_line is None:
    print(f'ERROR: Could not find boundaries. start={start_line}, end={end_line}')
    exit(1)

print(f'Replacing lines {start_line+1} through {end_line+1}')
print(f'Old line {start_line+1}: {lines[start_line].rstrip()}')
print(f'Old line {end_line+1}: {lines[end_line].rstrip()}')

# Read the em-dash character from the existing file for faithful reproduction
em_dash = '\u2014'  # —

replacement = f'''        // First pass: resolve what we can synchronously, collect unresolved names for warehouse lookup
        const unresolvedNames: Map<string, string[]> = new Map(); // firstName -> [rowId, ...]
        const firstPassResults = rows.map(row => {{
          let {{ recipientName, recipientPhone, recipientEmail }} = row;

          // If direct columns are populated, use them as-is
          if (recipientName || recipientPhone || recipientEmail) {{
            return {{
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName, recipientPhone, recipientEmail,
              _needsLookup: false,
            }};
          }}

          // Fall back to campaign_recipients JOIN data for legacy rows
          if (row.crFirstName || row.crLastName || row.crPhone || row.crEmail) {{
            const joinedName = [row.crFirstName, row.crLastName].filter(Boolean).join(' ') || null;
            return {{
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName: joinedName,
              recipientPhone: row.crPhone || null,
              recipientEmail: row.crEmail || null,
              _needsLookup: false,
            }};
          }}

          // Last resort: extract phone/email from messageContent for truly orphaned rows
          let extractedPhone: string | null = null;
          let extractedEmail: string | null = null;
          if (row.messageContent) {{
            // Match "STOP confirmation to +1234567890" and similar patterns
            const explicitPhoneMatch = row.messageContent.match(/(?:to |confirmation to |sent to )(\\+?[\\d\\-()\\s]{{7,}})/i);
            if (explicitPhoneMatch) {{
              extractedPhone = explicitPhoneMatch[1].trim();
            }}
            // Match email addresses anywhere in messageContent
            const emailMatch = row.messageContent.match(/[\\w.+-]+@[\\w.-]+\\.\\w{{2,}}/);
            if (emailMatch) extractedEmail = emailMatch[0];
            // Match "[notification:*] ... sent to N admin(s)" pattern for subject extraction
            const notifMatch = row.messageContent.match(/\\[notification:[^\\]]+\\]\\s*(.+?)\\s*{em_dash}/);
            if (notifMatch && !recipientName) {{
              recipientName = notifMatch[1].trim() || null;
            }}
          }}

          // If still no phone, try to extract first name for warehouse_leads lookup
          const needsLookup = !extractedPhone && row.channel === 'sms';
          if (needsLookup && row.messageContent) {{
            const nameMatch = row.messageContent.match(/^Hi (\\w+),/);
            if (nameMatch && nameMatch[1] !== 'there') {{
              const firstName = nameMatch[1];
              const ids = unresolvedNames.get(firstName) || [];
              ids.push(row.id);
              unresolvedNames.set(firstName, ids);
            }}
          }}

          return {{
            id: row.id, channel: row.channel, status: row.status,
            messageContent: row.messageContent, sentAt: row.sentAt,
            createdAt: row.createdAt, recipientId: row.recipientId,
            campaignId: row.campaignId,
            recipientName: recipientName || null,
            recipientPhone: extractedPhone,
            recipientEmail: extractedEmail,
            _needsLookup: needsLookup,
          }};
        }});

        // Second pass: batch lookup warehouse_leads by first name for unresolved SMS rows
        if (unresolvedNames.size > 0) {{
          const nameList = Array.from(unresolvedNames.keys());
          const warehouseRows = await db.select({{
            customerName: warehouseLeads.customerName,
            customerPhone: warehouseLeads.customerPhone,
          }}).from(warehouseLeads).where(and(
            eq(warehouseLeads.organizationId, organizationId),
            isNotNull(warehouseLeads.customerPhone),
          ));

          // Build firstName -> phone map from warehouse data
          const phoneByFirstName: Record<string, string> = {{}};
          for (const wl of warehouseRows) {{
            if (!wl.customerPhone || !wl.customerName) continue;
            const firstName = wl.customerName.split(' ')[0];
            if (nameList.includes(firstName) && !phoneByFirstName[firstName]) {{
              phoneByFirstName[firstName] = wl.customerPhone;
            }}
          }}

          // Apply matches back to unresolved rows
          for (const result of firstPassResults) {{
            if (!result._needsLookup || result.recipientPhone) continue;
            if (!result.messageContent) continue;
            const nameMatch = result.messageContent.match(/^Hi (\\w+),/);
            if (nameMatch && nameMatch[1] !== 'there' && phoneByFirstName[nameMatch[1]]) {{
              result.recipientPhone = phoneByFirstName[nameMatch[1]];
            }}
          }}
        }}

        return firstPassResults.map(({{ _needsLookup, ...rest }}) => rest);
'''

new_lines = lines[:start_line] + [replacement] + lines[end_line+1:]

with open(filepath, 'w') as f:
    f.writelines(new_lines)

print('PATCH APPLIED SUCCESSFULLY')
