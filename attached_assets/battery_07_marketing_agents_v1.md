# BATTERY 7 — MARKETING AGENTS: 5 SPECIALIZED AI AGENTS + STUDIO GALLERY
## v1.0 — Gap-First Edition | Claude Agent Team Test Prompt

---

## CONTEXT RESET
Load only: This prompt + Master Coordinator v2.0 + B6 Handoff (if available)

---

## GAP-FIRST OPERATING INSTRUCTION
Marketing Agents are a new feature vertical. Every agent tool, inline render,
artifact pipeline, cross-agent handoff, and Studio Gallery interaction must be
verified independently. Partial passes create downstream failures in cross-agent
workflows. Be rigorous.

---

## TEST CONTACT
```
Name:    Duane Wells
Email:   duane.wells@huminic.ai
Pass:    a1$ucc3ss
Role:    super_admin
Login:   /login → Marketing tab
```

---

## MISSION

Validate that ALL 5 Marketing Agents and supporting infrastructure are:
1. Present and launchable from the sidebar and agent grid
2. Correctly configured with accent colors, system prompts, and tools
3. Tool execution produces correct inline renderings and artifacts
4. Artifacts appear in Studio Gallery with correct metadata
5. Cross-agent routing via action chips works end-to-end
6. Sharing panel generates links and renders social preview
7. No accent color drift from spec

---

## AGENT REFERENCE (CANONICAL — VERIFY EACH)

| Agent | ID | Accent Color | Tool(s) | Artifact Type(s) |
|-------|-----|-------------|---------|-------------------|
| Photo Studio | photo-studio | #14b8a6 (teal) | generate_hero_image, swap_vehicle_background | IMAGE |
| Video Producer | video-producer | #3b82f6 (blue) | generate_promo_video, generate_voiceover | VIDEO, VOICEOVER |
| Copywriter | copywriter | #8b5cf6 (violet) | generate_ad_copy | COPY |
| Creative Director | creative-director | #f59e0b (amber) | score_ad_image | SCORE |
| Market Intel | market-intel | #22c55e (green) | scan_competitor_radar | RADAR |

---

## SECTION 7A: AGENT PRESENCE & CONFIGURATION

### TC-7A-001: All 5 agents visible in sidebar
```
Steps:
  1. Login as duane.wells@huminic.ai
  2. Navigate to Marketing section
  3. Open sidebar submenu for Marketing
Expected:
  □ "AI Agents" section visible in submenu
  □ All 5 agent names listed: Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel
  □ Clicking each navigates to /marketing?tab=agents&agent={id}
```

### TC-7A-002: Agent launcher grid
```
Steps:
  1. Navigate to /marketing?tab=agents
Expected:
  □ 5 agent cards rendered in a grid
  □ Each card shows agent name, description, accent color indicator
  □ Clicking a card opens AgentChatView for that agent
```

### TC-7A-003: Accent color drift check (per agent)
```
For each of the 5 agents:
  1. Navigate to /marketing?tab=agents&agent={id}
Expected:
  □ Agent icon background uses agent accent color (with opacity)
  □ Badge in artifact list uses agent accent color
  □ InlineCompetitorRadar (Market Intel only) uses #22c55e
  □ No agent uses another agent's color
```

### TC-7A-004: System prompt verification
```
For each agent, verify the chat behavior matches the system prompt:
  □ Photo Studio responds to image generation requests
  □ Video Producer responds to video/voiceover requests
  □ Copywriter responds to ad copy requests
  □ Creative Director responds to image scoring requests
  □ Market Intel responds to competitor scanning requests
```

---

## SECTION 7B: TOOL EXECUTION & INLINE RENDERING

### TC-7B-001: Photo Studio — generate_hero_image
```
Steps:
  1. Open Photo Studio agent
  2. Send: "Generate a hero image of a 2024 Ford Mustang in a showroom"
Expected (wait up to 45s):
  □ Tool progress indicator appears during execution
  □ Generated image renders inline (InlineMedia with type='image')
  □ IMAGE artifact created and visible in visor/artifact list
  □ Action chips appear: "Send to Video Producer", "Score this image", "Generate variation"
  □ data-testid="action-chip-send_to_video" exists
  □ data-testid="action-chip-score_image" exists
```

### TC-7B-002: Photo Studio — swap_vehicle_background
```
Steps:
  1. Upload a vehicle image (or use previously generated image)
  2. Send: "Swap the background to a mountain sunset"
Expected:
  □ Composited image renders inline
  □ IMAGE artifact created
  □ Action chips: "Send to Video Producer", "Score this image", "Try different background"
```

### TC-7B-003: Video Producer — generate_promo_video
```
Steps:
  1. Open Video Producer agent
  2. Send: "Create a 5-second promo video for a 2024 Honda Civic"
Expected (wait up to 60s):
  □ Tool progress indicator appears
  □ Video renders inline (InlineMedia with type='video')
  □ VIDEO artifact created
  □ Action chips: "Add voiceover", "Score the thumbnail", "Download MP4"
```

### TC-7B-004: Video Producer — generate_voiceover
```
Steps:
  1. Send: "Generate a voiceover saying: Visit Ford of Columbia today for amazing deals"
Expected:
  □ Audio player renders inline (InlineMedia with type='audio')
  □ VOICEOVER artifact created
  □ Action chips: "Pair with video", "Download MP3", "Try different voice"
```

### TC-7B-005: Copywriter — generate_ad_copy
```
Steps:
  1. Open Copywriter agent
  2. Send: "Write ad copy for a 2024 Toyota Camry, emphasize reliability and value"
Expected:
  □ InlineAdCopy component renders with expandable accordion sections
  □ 5 format categories with variations
  □ Copy-to-clipboard buttons on each variation
  □ COPY artifact created
  □ Action chips: "Turn this into a voiceover", "Score this campaign", "Try different tone"
```

### TC-7B-006: Creative Director — score_ad_image
```
Steps:
  1. Open Creative Director agent
  2. Upload or reference an image
  3. Send: "Score this image for ad readiness"
Expected:
  □ InlineScoreCard renders with animated circular score badge (0 → final score)
  □ 5 animated horizontal category bars with color coding
  □ Publish banner: green PUBLISH READY / amber NEEDS WORK / red NOT READY
  □ Score-conditional action chips (varies by score)
  □ SCORE artifact created
```

### TC-7B-007: Market Intel — scan_competitor_radar
```
Steps:
  1. Open Market Intel agent
  2. Send: "Scan competitors near 123 Main St, Springfield, IL"
Expected:
  □ InlineCompetitorRadar renders with ranked competitor cards
  □ Each card: rank number, dealer name, star rating, review count, distance, address
  □ Demo mode banner (amber) if no GOOGLE_MAPS_API_KEY
  □ Green accent (#22c55e) on cards
  □ RADAR artifact created
  □ Action chips: "Scan Another Area", "Export Report"
  □ data-testid="inline-competitor-radar" exists
  □ data-testid="demo-mode-banner" exists (if demo mode)
```

---

## SECTION 7C: STUDIO GALLERY

### TC-7C-001: Gallery renders with artifacts
```
Steps:
  1. After running at least one agent tool (from 7B tests), navigate to /marketing?tab=studio
Expected:
  □ Studio Gallery renders (data-testid="studio-gallery")
  □ At least 1 artifact card visible from previous tool executions
```

### TC-7C-002: Type filter pills
```
Steps:
  1. On Studio Gallery, observe filter row
Expected:
  □ Filter pills present: All, Images, Videos, Copy, Scores, Voiceovers, Radar
  □ Clicking a filter pill filters the grid to only that artifact type
  □ "All" resets the filter
```

### TC-7C-003: Agent filter pills
```
Expected:
  □ 5 agent filter pills with names: Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel
  □ Active agent pill shows agent's accent color background
  □ Clicking toggles agent filter on/off
  □ Multiple type + agent filters combine correctly
```

### TC-7C-004: Artifact card structure
```
For each visible card:
  □ Thumbnail area (image preview for IMAGE/VIDEO, score for SCORE, text for COPY, icon for others)
  □ Type badge (uppercase label)
  □ Agent badge with accent color dot + agent name
  □ timeAgo timestamp (e.g. "2 minutes ago")
  □ Action buttons: Download (if URL exists), Resume (Play icon), Send (forward icon), Share
```

### TC-7C-005: Resume action
```
Steps:
  1. Click Resume (Play) button on an artifact card
Expected:
  □ Navigates to /marketing?tab=agents&agent={agentId}&session={sessionId}
  □ The original agent chat session loads with message history preserved
```

### TC-7C-006: Send to Agent action
```
Steps:
  1. Click Send button on an artifact card
Expected:
  □ Agent picker popup appears with 4 agents (excluding the card's source agent)
  □ Each agent shows accent color dot + name
  □ Clicking an agent navigates to /marketing?tab=agents&agent={targetId}&session=new&artifactRef={artifactId}
  □ Target agent opens with a new session containing artifact context
```

### TC-7C-007: Download action
```
Steps:
  1. Click Download button on an artifact card that has a URL (IMAGE or VIDEO type)
Expected:
  □ Browser triggers file download
```

---

## SECTION 7D: CROSS-AGENT WORKFLOW

### TC-7D-001: Photo Studio → Creative Director (Score this image)
```
Steps:
  1. Generate an image in Photo Studio (TC-7B-001)
  2. Click "Score this image" action chip
Expected:
  □ Navigates to Creative Director agent
  □ New session created with artifact context message
  □ Context message references the image artifact
```

### TC-7D-002: Photo Studio → Video Producer (Send to Video)
```
Steps:
  1. Generate an image in Photo Studio
  2. Click "Send to Video Producer" action chip
Expected:
  □ Navigates to Video Producer agent
  □ New session with artifact context
```

### TC-7D-003: Copywriter → Video Producer (Turn into voiceover)
```
Steps:
  1. Generate ad copy in Copywriter
  2. Click "Turn this into a voiceover" action chip
Expected:
  □ Navigates to Copywriter agent (voiceover tool is on Copywriter/Video Producer)
  □ New session with copy context
```

### TC-7D-004: Video Producer → Creative Director (Score thumbnail)
```
Steps:
  1. Generate a video in Video Producer
  2. Click "Score the thumbnail" action chip
Expected:
  □ Navigates to Creative Director
  □ Artifact context pre-loaded
```

---

## SECTION 7E: SHARING PANEL

### TC-7E-001: Share from Studio Gallery
```
Steps:
  1. On Studio Gallery, click Share button on any artifact card
Expected:
  □ SharingPanel dialog opens (data-testid="sharing-panel")
  □ Artifact preview shown (image thumbnail or title + type badge)
  □ Copy Link button (data-testid="btn-copy-link")
  □ Download button (data-testid="btn-share-download")
  □ Social preview card (data-testid="social-preview-card")
  □ "Created with Nexxus Connect" branding text visible
```

### TC-7E-002: Copy link action
```
Steps:
  1. Click "Copy Link" in SharingPanel
Expected:
  □ Success toast appears confirming link copied
  □ Clipboard contains URL in format: {origin}/shared/artifact/{artifactId}
```

### TC-7E-003: Share from artifact visor
```
Steps:
  1. In agent chat, click on an artifact in the right pane artifact list
  2. In artifact detail dialog, click Share
Expected:
  □ SharingPanel opens with artifact details
  □ Agent name and accent color visible in social preview
```

---

## SECTION 7F: REGRESSION & EDGE CASES

### TC-7F-001: Empty state
```
Steps:
  1. Clear localStorage (or use fresh browser context)
  2. Navigate to /marketing?tab=studio
Expected:
  □ Empty state renders (data-testid="empty-state-studio")
  □ "No artifacts yet" message visible
```

### TC-7F-002: Session persistence
```
Steps:
  1. Have a conversation with any agent
  2. Navigate away (/marketing?tab=dashboard)
  3. Return to the same agent
Expected:
  □ Previous session messages preserved
  □ Artifacts from that session still visible
```

### TC-7F-003: Multiple sessions per agent
```
Steps:
  1. Start a conversation, generate an artifact
  2. Navigate via Send to Agent with session=new
  3. Return to original agent
Expected:
  □ Both sessions accessible
  □ Each session has its own message history
```

### TC-7F-004: Star rating edge cases (Market Intel)
```
Verify:
  □ Ratings > 5 are clamped to 5 (no crash)
  □ Ratings < 0 are clamped to 0
  □ Half stars render correctly (e.g., 3.7 → 3 full + 1 half + 1 empty)
```

---

## PASS GATE

Battery 7 passes when:
- ALL 5 agents launch and respond correctly
- ALL tool inline renderings work
- ALL artifacts appear in Studio Gallery
- Cross-agent routing works for at least 2 workflows
- Sharing panel generates links + renders preview
- No accent color drift detected
- No P0 gaps logged

P0 = agent fails to launch, tool execution crashes, artifact pipeline broken
P1 = incorrect inline rendering, cross-agent routing fails, accent color mismatch
P2 = cosmetic issues (spacing, alignment), minor UX inconsistencies
P3 = enhancement opportunities, tooltip wording
