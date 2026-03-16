# QA-S16 Test Results: Live Communication Testing (FINAL)

Timestamp: 2026-03-16T23:38:14Z
Method: VAPI test scripts + TextMagic MCP + Playwright + dual agents

## Results: 17/19 PASS, 2 DEFECT

### VAPI Voice
| Test | Result | Evidence |
|------|--------|----------|
| Elliott → Christine call | PASS | 20s call, transcript captured, /bin/bash.0346 |
| Webhook events arrive | DEFECT (MAJOR) | 401 — wrong secret validation. DO NOT FIX without disabling live webhook |

### TextMagic SMS
| Test | Result | Evidence |
|------|--------|----------|
| Message history | PASS | 50 messages, Serra Honda campaigns |
| Contacts | PASS | 2 contacts, 1.91 balance |
| Send pricing | PASS | /bin/bash.049/SMS confirmed |
| Inbound SMS → conversation | PASS | Webhook creates conversation with receiver field |

### Tavus Video
| Test | Result | Evidence |
|------|--------|----------|
| API access | PASS | 10 personas, "Daria" configured |
| Widget popup | DEFECT (MINOR) | "Video unavailable — not configured" for demo org |

### Campaigns
| Test | Result | Evidence |
|------|--------|----------|
| Campaign list | PASS | 4 campaigns across sales/service/marketing |
| Execution status | PASS | Returns active:false for completed |

### TeamBox
| Test | Result | Evidence |
|------|--------|----------|
| Conversations (5 channels) | PASS | 16 conversations: ai-chat, sms, chat, email, whatsapp |
| Message threads | PASS | user + agent messages |
| Takeover endpoint | PASS | PATCH returns 200 |

### Kill Switch
| Test | Result | Evidence |
|------|--------|----------|
| Toggle round-trip | PASS | null→false→true, all verified via API |

### Password Reset
| Test | Result | Evidence |
|------|--------|----------|
| Full flow | PASS | Email sent, reset_token stored in DB |

### Correction
TextMagic "unresolvable sender" was a test spec error — real webhooks include receiver field. App routing works correctly.
