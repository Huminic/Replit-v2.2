# Nexxus V2 — Icon Reference

All icons use **lucide-react**. Import as: `import { IconName } from 'lucide-react'`

No custom SVGs are used. All icons are from the Lucide library.

---

## Navigation Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Home | `Home` | Main page / home navigation |
| Dashboard | `BarChart3` | Insights page |
| Chat | `MessageSquare` | Main chat, communication |
| Bot | `Bot` | Agents page |
| Calendar | `Calendar` | Hub calendar tab |
| Folder | `Folder` | Drive page |
| Settings | `Settings` | System Settings page |
| User | `User` | Profile page |
| Users | `Users` | User management |
| Activity | `Activity` | Activity feed (in Insights sub-menu) |
| Briefcase | `Briefcase` | Hub |
| Sidebar | `Sidebar` | Sidebar toggle |
| Menu | `Menu` | Mobile hamburger menu |

## Action Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Plus | `Plus` | Create new items |
| Pencil | `Pencil` | Edit actions |
| Edit | `Edit` | Edit mode |
| Copy | `Copy` | Copy to clipboard (embed codes) |
| Download | `Download` | Download files |
| Upload | `Upload` | Upload files |
| Share | `Share` | Share files/content |
| External Link | `ExternalLink` | Open in new tab |
| More Horizontal | `MoreHorizontal` | Overflow menu (horizontal) |
| More Vertical | `MoreVertical` | Overflow menu (vertical) |
| Save | `Save` | Save changes |
| Search | `Search` | Search fields |
| Filter | `Filter` | Filter controls |
| Grip Vertical | `GripVertical` | Drag handle |
| Link | `Link` | Copy link / hyperlink |

## Directional / Chevron Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Arrow Left | `ArrowLeft` | Back navigation |
| Arrow Right | `ArrowRight` | Forward navigation |
| Chevron Down | `ChevronDown` | Dropdown indicators |
| Chevron Up | `ChevronUp` | Collapse indicators |
| Chevron Left | `ChevronLeft` | Sub-menu collapse |
| Chevron Right | `ChevronRight` | Sub-menu expand / list navigation |
| Chevrons Left | `ChevronsLeft` | Pin sub-menu (collapse toggle) |
| Chevrons Right | `ChevronsRight` | Pin sub-menu (expand toggle) |

## Status / Feedback Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Check | `Check` | Confirmation, selected state |
| Check Circle | `CheckCircle` | Success status |
| Alert Circle | `AlertCircle` | Error/warning indicator |
| Alert Triangle | `AlertTriangle` | Warning status |
| Info | `Info` | Informational tooltip/note |
| Circle | `Circle` | Radio/status dot |
| Dot | `Dot` | List bullet / indicator |
| Clock | `Clock` | Time/schedule |
| Trending Up | `TrendingUp` | Positive trend arrow |
| Trending Down | `TrendingDown` | Negative trend arrow |

## Communication Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Phone | `Phone` | Voice call, phone display |
| Phone Off | `PhoneOff` | End call |
| Video | `Video` | Video call, live video widget |
| Mic | `Mic` | Voice input, recording |
| Mic Off | `MicOff` | Mute microphone |
| Mail | `Mail` | Email compose/send |
| Message Circle | `MessageCircle` | Chat bubble / text chat |
| Message Square | `MessageSquare` | Main chat interface |
| Send | `Send` | Send message button |
| Inbox | `Inbox` | Communication inbox |
| Voicemail | `Voicemail` | Voicemail indicator |
| Volume | `Volume` | Audio/volume control |

## Data / Chart Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Bar Chart | `BarChart3` | Bar chart, analytics |
| Line Chart | `LineChart` | Line chart, trends |
| Pie Chart | `PieChart` | Pie chart, distribution |
| Layout Grid | `LayoutGrid` | Grid view toggle |
| List | `List` | List view toggle |
| Table | `Table` | Table view |
| Target | `Target` | Goals, targeting |

## Toggle / Theme Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Eye | `Eye` | Show/visibility |
| Sun | `Sun` | Light mode |
| Moon | `Moon` | Dark mode |
| Toggle Left | `ToggleLeft` | Switch off state |
| Toggle Right | `ToggleRight` | Switch on state |
| Panel Left Icon | `PanelLeftIcon` | Panel toggle |

## Content / File Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| File | `File` | Generic file |
| File Text | `FileText` | Document file |
| Image | `Image` | Image file |
| Music | `Music` | Audio file |
| Film | - | Video file (not currently imported) |
| Code | `Code` | Code/embed snippet |

## System / Security Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Shield | `Shield` | Security settings |
| Key | `Key` | API keys, authentication |
| Lock | `Lock` | Locked/secured |
| Database | `Database` | Database/storage |
| Server | `Server` | Server/infrastructure |
| Globe | `Globe` | Domains, website |
| Wrench | `Wrench` | Tools configuration |
| Zap | `Zap` | Automations, quick actions |
| Sparkles | `Sparkles` | AI features, magic actions |
| Lightbulb | `Lightbulb` | Hunches, insights, ideas |
| Palette | `Palette` | Appearance/theme settings |
| Navigation | `Navigation` | Navigation/location |
| Map | `Map` | Map/location |

## Utility Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| X | `X` | Close buttons, dismiss |
| Minus | `Minus` | Minimize, remove |
| Star | `Star` | Favorites (filled = favorited, outline = not) |
| Pin | `Pin` | Pin items |
| History | `History` | Message history |
| Credit Card | `CreditCard` | Billing/payment |
| Log Out | `LogOut` | Sign out |
| Play | `Play` | Play media |
| Pause | `Pause` | Pause media |
| Building2 | - | Org switcher (imported in TopBar) |
| Bell | `Bell` | Notifications |
| Command | `Command` | Command palette trigger |

---

## Icon Styling Conventions

- **Default size**: `h-4 w-4` (16px) for inline icons
- **Navigation icons**: `h-5 w-5` (20px) in sidebar
- **Large display icons**: `h-6 w-6` (24px) or `h-8 w-8` (32px) for feature icons
- **Color**: `text-muted-foreground` (muted gray) for most icons
- **Active state**: `text-primary` or `text-foreground` when active/selected
- **Destructive**: `text-destructive` for delete/danger actions
- **Status colors**: Match the status badge color system
