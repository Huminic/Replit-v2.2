# Nexxus Connect — Customer-Facing Messages

All messages that a customer, user, or lead will see. Organized by channel and trigger.

---

## SMS Messages

### Auto-Greeting (New Inbound SMS — Business Hours)

Sent when a new SMS arrives from an unknown number during business hours and an agent has `autoGreeting` configured.

| Field | Source |
|-------|--------|
| `{{customerName}}` | Sender phone number (no name available for first contact) |
| `{{dealershipName}}` | Organization name |
| `{{agentName}}` | Agent name (e.g., Caroline, Magnolia) |

**Current message (Caroline — Serra Honda):**

> Hi {{customerName}}! This is {{agentName}} from {{dealershipName}}. Thank you for your interest — I'd love to help you find the perfect vehicle. What are you looking for?

**Resolved example:**

> Hi 2562676661! This is Caroline from Serra Honda. Thank you for your interest — I'd love to help you find the perfect vehicle. What are you looking for?

---

### Auto-Greeting (New Inbound SMS — After Hours)

Sent when a new SMS arrives outside business hours. Uses `afterHoursResponse` from agent settings if configured, otherwise falls back to the standard auto-greeting above.

| Field | Source |
|-------|--------|
| `{{customerName}}` | Sender phone number |
| `{{dealershipName}}` | Organization name |
| `{{agentName}}` | Agent name |

**Current message:** Configurable per agent in settings. No default set in seed data — falls back to the business hours greeting if not configured.

---

### Campaign SMS (Outbound — Per Recipient)

Sent during campaign execution. Template set when campaign is created.

| Field | Source |
|-------|--------|
| `{{customerName}}` | First + Last name from CSV |
| `{{firstName}}` | First name from CSV |
| `{{lastName}}` | Last name from CSV |
| `{{dealershipName}}` | Organization name |

**Default fallback message (if no template set):**

> Hello {{customerName}}, this is a message from {{dealershipName}}.

**Comms test message (seed):**

> Hi {{customerName}}, this is Serra Honda. Your vehicle may be due for scheduled maintenance. Reply YES to schedule or call us at (901) 203-8267.

**Fields needed for vehicle campaigns (S-18 — not yet built):**

| Field | Source |
|-------|--------|
| `{{vehicleYear}}` | Year from CSV |
| `{{vehicleModel}}` | Model from CSV |
| `{{vin}}` | VIN from CSV |

**Example recall campaign message (after S-18):**

> Hi {{firstName}}, this is {{dealershipName}}. We're reaching out regarding your {{vehicleYear}} {{vehicleModel}} about an important safety recall. Please call us or reply to this message to schedule your service. We want to make sure you and your family stay safe.

---

### Lead Follow-Up SMS (Scheduler Trigger)

Sent by the scheduler when a new VIN lead is due for follow-up (configurable delay, default 48 hours).

| Field | Source |
|-------|--------|
| `{customerFirstName}` | First word of lead's customer name |
| `{agentName}` | Agent name |
| `{dealerStoreName}` | Organization name |

**Note:** These use single-brace `{field}` syntax, not double-brace `{{field}}`.

**Default message:**

> Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to follow up with you to see if you had any questions and if your experience with our dealer so far has been a good one. Please let me know if I can be of any assistance or if you have any feedback.

---

## Email Messages

### Welcome Email (New User Created)

Sent when an admin creates a new user account.

| Field | Value |
|-------|-------|
| From | `Nexxus Connect <no-reply@huminic.app>` |
| Subject | `Welcome to {org name} on Nexxus Connect` |

**Body:**

> **Welcome to {org name}!**
>
> Hi {first name},
>
> Your account has been created for **{org name}** by {creator first} {creator last}.
>
> You can log in using your email address: **{email}**
>
> Please change your password after your first login for security purposes.
>
> Welcome aboard!

---

### Invite Email (User Invited)

Sent when an admin invites a new user with a temporary password.

| Field | Value |
|-------|-------|
| From | `Nexxus Connect <no-reply@huminic.app>` |
| Subject | `You've been invited to {org name}` |

**Body:**

> **Welcome to {org name}!**
>
> {inviter first} {inviter last} has invited you to join their organization.
>
> Your temporary credentials:
> - **Email:** {email}
> - **Password:** {temp password}
>
> Please change your password after your first login.

---

### Password Reset Email

Sent when a user requests a password reset.

| Field | Value |
|-------|-------|
| From | Resend default (via API) |
| Subject | `Password Reset — Nexxus Connect` |

**Body:**

> Hi {first name},
>
> Click the link below to reset your password. This link expires in 1 hour.
>
> {reset URL}
>
> If you did not request this, ignore this email.

---

### Campaign Email (Outbound — Per Recipient)

Sent during email campaign execution. Uses the same template substitution as SMS campaigns.

| Field | Value |
|-------|-------|
| From | `Nexxus Connect <notifications@huminic.ai>` |
| Subject | `Message from Nexxus Connect` |

**Body:** Campaign `messageTemplate` with merge fields resolved (same fields as Campaign SMS above).

---

### Lead Notification Email (Internal — Voice/Video)

Sent to dealership admins when a VAPI voice call or Tavus video session completes. **Not customer-facing — sent to staff.**

| Field | Value |
|-------|-------|
| From | `{org name} <notifications@huminic.ai>` |
| Subject | `New AI Voice Lead` or `New AI Video Session Lead` |

**Body:** Rich HTML email with call summary, transcript, customer phone, duration, recording link, and CRM link.

---

### TeamBox Reply Email (Manual — Staff to Customer)

Sent when a staff member sends an email from the TeamBox conversation view. Subject and body are composed by the user — no template.

| Field | Value |
|-------|-------|
| From | `{org name} <notifications@huminic.ai>` |
| Subject | User-composed |

---

## Merge Field Reference

### Currently Supported (Campaign SMS/Email)

| Merge Field | Resolves To | Source |
|-------------|-------------|--------|
| `{{customerName}}` | "Preston Parker" | firstName + lastName from CSV |
| `{{firstName}}` | "Preston" | firstName from CSV |
| `{{lastName}}` | "Parker" | lastName from CSV |
| `{{dealershipName}}` | "Serra Honda" | Organization name |

### Planned — S-18 (Campaign Vehicle Personalization)

| Merge Field | Resolves To | Source |
|-------------|-------------|--------|
| `{{vehicleYear}}` | "2024" | Year from CSV |
| `{{vehicleModel}}` | "PROLOGUE 2WD EX" | Model from CSV |
| `{{vin}}` | "3GPKHURMXRS508589" | VIN from CSV |

### Auto-Greeting / After-Hours (SMS)

| Merge Field | Resolves To | Source |
|-------------|-------------|--------|
| `{{customerName}}` | Phone number (no name on first contact) | Sender phone |
| `{{dealershipName}}` | Organization name | Org record |
| `{{agentName}}` | Agent name | Agent record |

### Scheduler Follow-Up (SMS) — Different Syntax

| Merge Field | Resolves To | Source |
|-------------|-------------|--------|
| `{customerFirstName}` | First word of name | Lead record |
| `{agentName}` | Agent name | Agent record |
| `{dealerStoreName}` | Organization name | Org record |

---

**Last Updated:** 2026-03-30
