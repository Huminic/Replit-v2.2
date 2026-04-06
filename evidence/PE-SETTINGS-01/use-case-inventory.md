# Use Case Inventory: PE-SETTINGS-01

**Date:** 2026-04-06
**Sprint:** PE-SETTINGS-01 -- Settings / Users / Notifications

---

## UC-01: Add User (explicit password)
**Section:** User Management
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Click "Add User" -> fill firstName, lastName, email, password, role -> Submit
**Backend:** POST /api/users -> creates user -> sends welcome email via Resend (if CommGate open + RESEND_API_KEY set)
**Expected outcome:** User appears in list, welcome email received, user can log in with provided password
**Known issue:** Email send bypasses OUTBOUND_LIVE_ENABLED global kill switch (I-235)

## UC-02: Invite User (auto-generated password)
**Section:** User Management
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Click "Invite User" -> fill firstName, lastName, email, role -> Submit
**Backend:** POST /api/users/invite -> creates user with temp password -> sends invite email with credentials via Resend
**Expected outcome:** User appears in list, invite email with temp password received, user can log in and change password
**Known issue:** If CommGate blocked or RESEND_API_KEY missing, user created but NO email sent. Operator sees "no email configured" or silent failure.

## UC-03: Edit User
**Section:** User Management
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Click user menu -> Edit User -> change name, role, active status -> Save
**Backend:** PATCH /api/users/{id}
**Expected outcome:** User details updated, reflected immediately in list

## UC-04: Deactivate User
**Section:** User Management
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Click user menu -> Deactivate
**Backend:** PATCH /api/users/{id} { isActive: false }
**Expected outcome:** User marked inactive, grayed out in list, cannot log in

## UC-05: Reset Password (for another user)
**Section:** User Management
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Click user menu -> Reset Password -> enter new password -> Submit
**Backend:** POST /api/users/{id}/reset-password
**Expected outcome:** Password changed, no email sent (admin must communicate new password manually)

## UC-06: Change Own Password
**Section:** User Management (dialog) + Profile page
**Actor:** any authenticated user
**Flow:** Settings > User Management > Change Password (or Profile > Change Password) -> current + new + confirm -> Submit
**Backend:** POST /api/auth/change-password
**Expected outcome:** Password changed, success toast

## UC-07: Edit Organization Profile
**Section:** Organization
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Organization tile -> edit name, persona name, phone, email, public listing -> Save Changes
**Backend:** PATCH /api/organizations/{id}
**Expected outcome:** Org fields updated, reflected in app context

## UC-08: Configure Business Hours / After-Hours Messaging
**Section:** Organization
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Organization tile -> set timezone, business hours start/end, after-hours message template -> Save
**Backend:** PATCH /api/settings/org
**Expected outcome:** After-hours auto-response uses configured hours and template. SMS webhook checks these settings.

## UC-09: Toggle Communication Gate
**Section:** Organization
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Organization tile -> toggle Communication Gate switch
**Backend:** PATCH /api/organizations/{id} { outboundEnabled: true/false }
**Expected outcome:** When OFF, all outbound campaign messages paused. When ON, outbound resumes (subject to OUTBOUND_LIVE_ENABLED global kill switch).

## UC-10: Toggle Individual Channels
**Section:** Organization
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Organization tile -> toggle SMS/Email/Phone/Video switches
**Backend:** PATCH /api/organizations/{id} { smsEnabled/emailEnabled/phoneEnabled/videoEnabled }
**Expected outcome:** Per-channel outbound control. Disabling a channel blocks sends through that channel.

## UC-11: Configure Notification Preferences
**Section:** Notifications
**Actor:** org_admin, partner_admin, super_admin
**Flow:** Notifications tile -> toggle email/SMS/push, set quiet hours, toggle per-event preferences -> Save
**Backend:** PATCH /api/settings/org { notifications: {...} }
**Expected outcome:** Notification delivery respects configured preferences. Quiet hours suppress alerts.
**Observation needed:** Do these toggles actually control anything downstream? Or are they UI-only with no backend enforcement?

## UC-12: Configure Appearance
**Section:** Appearance
**Actor:** any authenticated user
**Flow:** Appearance tile -> toggle compact mode, animations, default view, metric tiles -> Save
**Storage:** localStorage (nexxus:appearance) -- browser-local only
**Expected outcome:** Preferences persist across page loads but NOT across browsers/devices
**Observation needed:** Does default view actually redirect on login? Does compact mode visibly change layout?

## UC-13: Edit Own Profile
**Section:** Profile page (/profile)
**Actor:** any authenticated user
**Flow:** Profile > Edit Profile -> change name, email -> Save
**Backend:** PATCH /api/users/me
**Expected outcome:** Profile updated, reflected in nav/header

## UC-14: Upload Profile Photo
**Section:** Profile page (/profile)
**Actor:** any authenticated user
**Flow:** Click avatar -> select image file -> upload
**Backend:** POST /api/users/me/photo
**Expected outcome:** Photo appears as avatar across the app. Max 500KB, image files only.
