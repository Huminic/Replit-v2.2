# Nexxus Connect Full Coverage

## Application Overview

Nexxus Connect v2.2 is a CRM/AI platform for automotive dealerships. Login at https://dev.huminicdev.com with orgadmin@serrahonda.com / NexxusTest2026. The app has: Dashboard with AI metrics (Active Pipeline, Appointments, Escalations, Outbound), AI Chat, TeamBox (unified inbox with 51 conversations), Department pages (Sales, Service, Marketing, Management), Settings (7 tiles: Users, Organization, Tools, Knowledge, AI Config, Notifications, Appearance), Insights analytics, Billing, Profile, Agents, and Widget test page.

## Test Scenarios

### 1. Dashboard & Metrics

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. Dashboard loads with metric tiles

**File:** `tests/generated/dashboard-metrics.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/
    - expect: Page loads with heading 'AI Key Metrics'
    - expect: Four metric tiles visible: Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h
  2. Check Active Pipeline metric value
    - expect: Active Pipeline shows a number (not 0 for stores with synced leads)
  3. Click on Active Pipeline metric tile
    - expect: Drill-down opens showing pipeline details or lead list
  4. Check chat input area below metrics
    - expect: Text input 'Ask me anything about your business' is visible
    - expect: Suggestion buttons visible: 'Show KPIs', 'Give me a dealership performance overview'

#### 1.2. Dashboard metrics are role-specific

**File:** `tests/generated/dashboard-role-metrics.spec.ts`

**Steps:**
  1. Login as sales@serrahonda.com and navigate to dashboard
    - expect: Dashboard loads with metrics relevant to Sales role
  2. Login as service@serrahonda.com and navigate to dashboard
    - expect: Dashboard loads with metrics relevant to Service role
  3. Login as executive@serrahonda.com and navigate to dashboard
    - expect: Dashboard loads with Management-level metrics

### 2. Settings Page

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. Settings shows all accessible tiles for Org Admin

**File:** `tests/generated/settings-tiles.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/settings
    - expect: Page shows 'System Settings' heading
    - expect: 6 tiles visible: User Management, Organization, Tools & Integrations, Knowledge Base, Notifications, Appearance
    - expect: AI Configuration tile is NOT visible (Super Admin only)
  2. Click User Management tile
    - expect: User management section opens with user list
    - expect: Back button appears
  3. Click back, then click Organization tile
    - expect: Organization section opens
    - expect: CommGate toggle (switch-communication-gate) is visible
  4. Click back, then click Tools & Integrations tile
    - expect: Tools section opens showing widgets and landing pages
  5. Click back, then click Knowledge Base tile
    - expect: Knowledge base section opens with document upload area
  6. Click back, then click Notifications tile
    - expect: Notification preferences section opens
  7. Click back, then click Appearance tile
    - expect: Appearance settings section opens with theme options

#### 2.2. Super Admin sees AI Configuration tile

**File:** `tests/generated/settings-super-admin.spec.ts`

**Steps:**
  1. Login as admin@nexxus.com and navigate to /settings
    - expect: AI Configuration tile is visible (7 tiles total)
  2. Click AI Configuration tile
    - expect: AI config section opens

#### 2.3. Sales role cannot access settings tiles

**File:** `tests/generated/settings-sales-restricted.spec.ts`

**Steps:**
  1. Login as sales@serrahonda.com and navigate to /settings
    - expect: No settings tiles visible or page redirects

### 3. TeamBox

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. TeamBox shows conversations with filters

**File:** `tests/generated/teambox-conversations.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/teambox
    - expect: TeamBox loads with conversation list
    - expect: Tab bar shows: Conversations, Tasks (with count), Workflows
    - expect: Status filters visible: All, Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending
    - expect: Channel filters visible: All, SMS, Email, Web Chat, WhatsApp, Voice
    - expect: Conversation count shows 'All 51' or similar
  2. Click on first conversation in the list
    - expect: Message thread opens in center panel
    - expect: Customer Info panel opens on right with Name, Channel, Status, Quick Actions (Call, Email, SMS)
  3. Click SMS channel filter
    - expect: Conversation list filters to show only SMS conversations
  4. Click Voice channel filter
    - expect: Conversation list filters to show only Voice conversations
  5. Search for 'Michael Clark' in search box
    - expect: Conversation list filters to show matching conversations

#### 3.2. TeamBox message thread shows messages

**File:** `tests/generated/teambox-messages.spec.ts`

**Steps:**
  1. Navigate to /teambox and click on Michael Clark conversation
    - expect: Message thread shows multiple messages
    - expect: Messages have role labels (customer/bot)
    - expect: Timestamps visible on messages
  2. Type a reply in the reply input
    - expect: Reply text input accepts text
    - expect: Send button becomes enabled

### 4. Insights Analytics

**Seed:** `tests/e2e/seed.spec.ts`

#### 4.1. Insights page loads with metrics

**File:** `tests/generated/insights-page.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/insights
    - expect: Insights page loads without errors
    - expect: Metric library section visible
    - expect: Dashboard zones render
  2. Check for non-zero metric values
    - expect: At least some metrics show non-zero values for stores with 1300+ leads
    - expect: Conversion rate is calculable (between 0-100%)

### 5. Widget & Landing Pages

**Seed:** `tests/e2e/seed.spec.ts`

#### 5.1. Widget test page shows all dealer buttons

**File:** `tests/generated/widget-test-page.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/widget/test
    - expect: Widget test page loads
    - expect: 5 dealer buttons visible: Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia
    - expect: Each button has correct slug and persona name
  2. Click Serra Honda button
    - expect: Widget JS loads or redirects to Tavus video session

#### 5.2. Widget dealer JS serves per org

**File:** `tests/generated/widget-dealer-js.spec.ts`

**Steps:**
  1. Request /widget/dealer/serra-honda.js with Accept: application/javascript
    - expect: Response is JavaScript (not HTML)
    - expect: Content length > 100 bytes
  2. Request /widget/dealer/serra-honda.js with Accept: text/html
    - expect: Response redirects to Tavus video or shows landing page with dealer name

### 6. Department Pages

**Seed:** `tests/e2e/seed.spec.ts`

#### 6.1. All department pages load with KPIs

**File:** `tests/generated/department-pages.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/sales
    - expect: Sales page loads with KPI tiles
    - expect: Agent list visible in sidebar
  2. Navigate to /service
    - expect: Service page loads with KPIs and campaigns section
  3. Navigate to /marketing
    - expect: Marketing page loads with KPIs
  4. Navigate to /management
    - expect: Management overview page loads
    - expect: Executive-level metrics visible

### 7. Profile & Billing

**Seed:** `tests/e2e/seed.spec.ts`

#### 7.1. Profile page shows user info

**File:** `tests/generated/profile-page.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/profile
    - expect: Profile page loads
    - expect: User name and email visible
    - expect: Password change section visible
    - expect: Restart Tour button visible

#### 7.2. Billing page loads for authorized roles

**File:** `tests/generated/billing-page.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/billing
    - expect: Billing page loads with usage or plan information
