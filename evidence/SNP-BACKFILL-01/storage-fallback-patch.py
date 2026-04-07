#!/usr/bin/env python3
"""
Patch script for server/storage.ts
Adds warehouse_leads fallback for trigger-originated SMS rows in outbound_sent query.
Sprint: SNP-BACKFILL-01
"""
import re

filepath = '/home/ubuntu/Claude-store/nexxus2.2_replit/server/storage.ts'

with open(filepath, 'r') as f:
    content = f.read()

OLD = '''        return rows.map(row => {
          let { recipientName, recipientPhone, recipientEmail } = row;

          // If direct columns are populated, use them as-is
          if (recipientName || recipientPhone || recipientEmail) {
            return {
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName, recipientPhone, recipientEmail,
            };
          }

          // Fall back to campaign_recipients JOIN data for legacy rows
          if (row.crFirstName || row.crLastName || row.crPhone || row.crEmail) {
            const joinedName = [row.crFirstName, row.crLastName].filter(Boolean).join(' ') || null;
            return {
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName: joinedName,
              recipientPhone: row.crPhone || null,
              recipientEmail: row.crEmail || null,
            };
          }

          // Last resort: extract phone/email from messageContent for truly orphaned rows
          let extractedPhone: string | null = null;
          let extractedEmail: string | null = null;
          if (row.messageContent) {
            // Match "STOP confirmation to +1234567890" and similar patterns
            const explicitPhoneMatch = row.messageContent.match(/(?:to |confirmation to |sent to )(\\+?[\\d\\-()\\s]{7,})/i);
            if (explicitPhoneMatch) {
              extractedPhone = explicitPhoneMatch[1].trim();
            }
            // Match email addresses anywhere in messageContent
            const emailMatch = row.messageContent.match(/[\\w.+-]+@[\\w.-]+\\.\\w{2,}/);
            if (emailMatch) extractedEmail = emailMatch[0];
            // Match "[notification:*] ... sent to N admin(s)" pattern for subject extraction
            const notifMatch = row.messageContent.match(/\\[notification:[^\\]]+\\]\\s*(.+?)\\s*\\u2014/);
            if (notifMatch && !recipientName) {
              recipientName = notifMatch[1].trim() || null;
            }
          }

          return {
            id: row.id, channel: row.channel, status: row.status,
            messageContent: row.messageContent, sentAt: row.sentAt,
            createdAt: row.createdAt, recipientId: row.recipientId,
            campaignId: row.campaignId,
            recipientName: recipientName || null,
            recipientPhone: extractedPhone,
            recipientEmail: extractedEmail,
          };
        });'''

NEW = '''        // First pass: resolve what we can synchronously, collect unresolved names for warehouse lookup
        const unresolvedNames: Map<string, string[]> = new Map(); // firstName -> [rowId, ...]
        const firstPassResults = rows.map(row => {
          let { recipientName, recipientPhone, recipientEmail } = row;

          // If direct columns are populated, use them as-is
          if (recipientName || recipientPhone || recipientEmail) {
            return {
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName, recipientPhone, recipientEmail,
              _needsLookup: false,
            };
          }

          // Fall back to campaign_recipients JOIN data for legacy rows
          if (row.crFirstName || row.crLastName || row.crPhone || row.crEmail) {
            const joinedName = [row.crFirstName, row.crLastName].filter(Boolean).join(' ') || null;
            return {
              id: row.id, channel: row.channel, status: row.status,
              messageContent: row.messageContent, sentAt: row.sentAt,
              createdAt: row.createdAt, recipientId: row.recipientId,
              campaignId: row.campaignId,
              recipientName: joinedName,
              recipientPhone: row.crPhone || null,
              recipientEmail: row.crEmail || null,
              _needsLookup: false,
            };
          }

          // Last resort: extract phone/email from messageContent for truly orphaned rows
          let extractedPhone: string | null = null;
          let extractedEmail: string | null = null;
          if (row.messageContent) {
            // Match "STOP confirmation to +1234567890" and similar patterns
            const explicitPhoneMatch = row.messageContent.match(/(?:to |confirmation to |sent to )(\\+?[\\d\\-()\\s]{7,})/i);
            if (explicitPhoneMatch) {
              extractedPhone = explicitPhoneMatch[1].trim();
            }
            // Match email addresses anywhere in messageContent
            const emailMatch = row.messageContent.match(/[\\w.+-]+@[\\w.-]+\\.\\w{2,}/);
            if (emailMatch) extractedEmail = emailMatch[0];
            // Match "[notification:*] ... sent to N admin(s)" pattern for subject extraction
            const notifMatch = row.messageContent.match(/\\[notification:[^\\]]+\\]\\s*(.+?)\\s*\\u2014/);
            if (notifMatch && !recipientName) {
              recipientName = notifMatch[1].trim() || null;
            }
          }

          // If still no phone, try to extract first name for warehouse_leads lookup
          const needsLookup = !extractedPhone && row.channel === 'sms';
          if (needsLookup && row.messageContent) {
            const nameMatch = row.messageContent.match(/^Hi (\\w+),/);
            if (nameMatch && nameMatch[1] !== 'there') {
              const firstName = nameMatch[1];
              const ids = unresolvedNames.get(firstName) || [];
              ids.push(row.id);
              unresolvedNames.set(firstName, ids);
            }
          }

          return {
            id: row.id, channel: row.channel, status: row.status,
            messageContent: row.messageContent, sentAt: row.sentAt,
            createdAt: row.createdAt, recipientId: row.recipientId,
            campaignId: row.campaignId,
            recipientName: recipientName || null,
            recipientPhone: extractedPhone,
            recipientEmail: extractedEmail,
            _needsLookup: needsLookup,
          };
        });

        // Second pass: batch lookup warehouse_leads by first name for unresolved SMS rows
        if (unresolvedNames.size > 0) {
          const nameList = Array.from(unresolvedNames.keys());
          const warehouseRows = await db.select({
            customerName: warehouseLeads.customerName,
            customerPhone: warehouseLeads.customerPhone,
          }).from(warehouseLeads).where(and(
            eq(warehouseLeads.organizationId, organizationId),
            isNotNull(warehouseLeads.customerPhone),
          ));

          // Build firstName -> phone map from warehouse data
          const phoneByFirstName: Record<string, string> = {};
          for (const wl of warehouseRows) {
            if (!wl.customerPhone || !wl.customerName) continue;
            const firstName = wl.customerName.split(' ')[0];
            if (nameList.includes(firstName) && !phoneByFirstName[firstName]) {
              phoneByFirstName[firstName] = wl.customerPhone;
            }
          }

          // Apply matches back to unresolved rows
          for (const result of firstPassResults) {
            if (!result._needsLookup || result.recipientPhone) continue;
            if (!result.messageContent) continue;
            const nameMatch = result.messageContent.match(/^Hi (\\w+),/);
            if (nameMatch && nameMatch[1] !== 'there' && phoneByFirstName[nameMatch[1]]) {
              result.recipientPhone = phoneByFirstName[nameMatch[1]];
            }
          }
        }

        return firstPassResults.map(({ _needsLookup, ...rest }) => rest);'''

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print('PATCH APPLIED SUCCESSFULLY')
else:
    print('OLD text not found — checking for em-dash encoding issue...')
    # The em-dash character may differ. Let's try a line-by-line approach
    # Find the exact text in the file around line 952
    lines = content.split('\n')
    # Find "return rows.map(row => {"
    start_idx = None
    for i, line in enumerate(lines):
        if 'return rows.map(row => {' in line and i > 940:
            start_idx = i
            break
    if start_idx:
        print(f'Found start at line {start_idx + 1}')
        # Show the problematic line
        for i in range(start_idx, min(start_idx + 60, len(lines))):
            if 'notifMatch' in lines[i] and '—' in lines[i]:
                print(f'Line {i+1} has em-dash: {repr(lines[i])}')
    else:
        print('Could not find start marker')
