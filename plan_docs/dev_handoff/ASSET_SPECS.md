# Nexxus V2 — Image & Illustration Specifications

Asset requirements for illustrations, logos, avatars, and data visualizations.

---

## 9A. Empty State Illustrations

The application uses **icon-based empty states** (Lucide icons) rather than custom illustrations. Each empty state consists of:
- Icon (muted gray, 48-64px)
- Heading text (`text-lg font-semibold`)
- Subtext (`text-sm text-muted-foreground`)
- CTA button (primary action)

### Empty State Specifications

| Context | Icon | Heading | Subtext | CTA |
|---------|------|---------|---------|-----|
| No agents | `Bot` | "No agents yet" | "Create your first AI agent to get started" | "Create Agent" |
| No leads | `Users` | "No open leads" | "Import leads or wait for new inquiries" | "Import Leads" |
| No files | `Folder` | "This folder is empty" | "Upload files or create a new folder" | "Upload" |
| No messages | `MessageSquare` | "No messages" | "Start a conversation" | "Compose" |
| No reports | `BarChart3` | "No reports generated" | "Create your first report to track performance" | "Create Report" |
| No search results | `Search` | "No results found" | "Try adjusting your search or filters" | "Clear Search" |
| No events | `Calendar` | "No events scheduled" | "Schedule an event to get started" | "Schedule" |
| No approvals | `CheckCircle` | "All caught up!" | "No pending approvals at this time" | - |
| No hunches | `Sparkles` | "No hunches yet" | "AI is analyzing your data for insights" | - |
| No notifications | `Bell` | "All clear" | "No new notifications" | - |
| Error state | `AlertCircle` | "Something went wrong" | "We couldn't load this content. Please try again." | "Retry" |

### Empty State Sizing
- **Inline** (within a panel/section): Icon 32px, heading text-base, compact padding
- **Full page** (when entire view is empty): Icon 48-64px, heading text-lg, centered vertically

**Note**: No custom SVG illustrations are used. If custom illustrations are desired for future enhancement, they should:
- Format: SVG with CSS custom property fills (adapt to light/dark theme)
- Max size: 200x200px inline, 300x300px full-page
- Style: Flat, minimal line art matching the Lucide icon aesthetic

---

## 9B. Logo & Avatar Specifications

### Application Logo
- **Location**: Top-left of Sidebar, TopBar on mobile
- **Format**: Text-based "Nexxus" with custom styling (no image logo currently)
- **Future**: If image logo is added, specs: max 180x40px, horizontal format, SVG or PNG with transparency

### Organization Logo
- **Location**: OrgSwitcher in TopBar center
- **Icon**: Building2 from Lucide (placeholder)
- **Future**: Organization logos should be max 32x32px in the switcher, 180x40px on settings pages

### User Avatar
- **Component**: Radix Avatar with fallback
- **Sizes**: Avatar sizes are defined per-component in source code. Common sizes: 24px (inline/small), 32px (list items), 40px (cards/headers), 64px (profile). See component source for exact sizing.
- **Shape**: Circular (`rounded-full`)
- **Fallback**: Initials on colored background
  - Color derived from name hash (deterministic — same name always gets same color)
  - Text: White, font-semibold
  - Colors pool: Blue, Green, Purple, Amber, Cyan, Rose, Indigo, Teal

### Agent Icons
- **Size**: 32x32px (list) or 40x40px (detail)
- **Style**: Lucide `Bot` icon with colored background circle
- **Colors**: Per-agent accent color (assigned from brand palette)

---

## 9C. Chart & Data Visualization Specifications

### Chart Library
- **Library**: Recharts (already in project dependencies)
- **Components used**: `LineChart`, `BarChart`, `PieChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`

### Color Palette for Data Series
Uses CSS custom properties from theme (adapts to light/dark mode):

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--chart-1` | Blue 500 `#3b82f6` | Blue 400 `#60a5fa` | Primary data series |
| `--chart-2` | Cyan 500 `#06b6d4` | Cyan 400 `#22d3ee` | Secondary series |
| `--chart-3` | Cyan 500 `#06b6d4` | Cyan 400 `#22d3ee` | Tertiary series |
| `--chart-4` | Green 500 `#10b981` | Green 400 `#34d399` | Positive/success series |
| `--chart-5` | Amber 500 `#f59e0b` | Amber 400 `#fbbf24` | Warning/attention series |

Only colors defined in the theme contract (`THEME_CONTRACT.md`) are used. Do not add color extensions without updating the theme contract.

### Axis Label Formatting
- **X-axis**: `text-xs text-muted-foreground`, rotated 0° (horizontal) unless space-constrained
- **Y-axis**: `text-xs text-muted-foreground`, formatted by data type:
  - Currency: "$0", "$50K", "$100K"
  - Percentage: "0%", "25%", "50%", "100%"
  - Count: "0", "500", "1K", "5K"
- **Grid lines**: `stroke={hsl(var(--border))}`, dashed

### Tooltip Design
- Background: `bg-popover` with `border border-border`
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-md`
- Text: `text-sm`
- Shows: series name + formatted value + date/label
- Dot indicator matching series color

### Legend
- Position: Below chart, centered
- Style: Horizontal row of color dot + label pairs
- Text: `text-xs text-muted-foreground`
- Interactive: Click to toggle series visibility (Recharts built-in)

### Empty/Loading State for Charts
- **Loading**: Skeleton rectangle matching chart dimensions, `animate-pulse`
- **Empty**: Centered text "No data available for this period" with muted chart outline

### Responsive Behavior
- All charts wrapped in `<ResponsiveContainer width="100%" height={...}>`
- Charts reflow (not scroll) — they resize to fit container
- Minimum chart height: 200px (mobile), 300px (desktop)
- On very small screens (< 400px): Consider hiding legend, simplifying axes

---

## 9D. Gradient Specifications

### Main Page Metric Tile Gradients
Role-specific gradient backgrounds on metric cards:

| Role | Gradient | Usage |
|------|---------|-------|
| Super Admin | `from-purple-500/10 to-blue-500/10` | System-wide metrics |
| Partner Admin | `from-blue-500/10 to-cyan-500/10` | Partner network metrics |
| Org Admin | `from-cyan-500/10 to-green-500/10` | Organization metrics |
| Staff | `from-green-500/10 to-amber-500/10` | Individual performance metrics |

### Chat Input Gradient Animation
- Colors: Purple (#8b5cf6) → Blue (#3b82f6) → Cyan (#06b6d4) → Purple (#8b5cf6)
- Animation: `gradient-shift` keyframes, 8s ease infinite
- Background-size: 300% 100%
- Box-shadow: `0 0 25px rgba(139, 92, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)`

### Widget Preview Header
- Background: Widget's `appearance.primaryColor` (user-configurable)
- Text: White on color background
- Default primary: `#3b82f6` (Blue 500)

---

## 9E. File Type Icons

Drive page uses Lucide icons to represent file types:

| File Type | Icon | Color |
|-----------|------|-------|
| Document (.doc, .docx, .pdf) | `FileText` | Blue |
| Spreadsheet (.xls, .xlsx, .csv) | `FileText` | Green |
| Image (.jpg, .png, .gif, .svg) | `Image` | Purple |
| Video (.mp4, .mov, .avi) | `Film` | Red |
| Audio (.mp3, .wav) | `Music` | Amber |
| Code (.js, .ts, .py, .html) | `Code` | Cyan |
| Generic / Unknown | `File` | Gray (muted) |
| Folder | `Folder` | Amber/Yellow |
