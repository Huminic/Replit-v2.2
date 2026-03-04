export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetAnimation = 'pulse' | 'bounce' | 'none';
export type WidgetType = 'video' | 'text' | 'voice' | 'unified';
export type LandingPageType = 'multi' | 'chat' | 'video' | 'callback';
export type AudienceType = 'all' | 'leads' | 'returning';
export type WidgetChannel = 'chat' | 'video' | 'voice' | 'sms' | 'callback';

export interface UniversalWidgetSettings {
  enabledChannels: Record<WidgetChannel, boolean>;
  defaultChannel: WidgetChannel;
  videoPersonaName: string;
  videoPersonaGreeting: string;
  videoAutoLaunch: boolean;
  smsNumber: string;
  callbackFormFields: string[];
}

export const defaultUniversalSettings: UniversalWidgetSettings = {
  enabledChannels: { chat: true, video: true, voice: true, sms: true, callback: true },
  defaultChannel: 'chat',
  videoPersonaName: 'Serra',
  videoPersonaGreeting: 'Hi! I\'m Serra, your AI concierge. How can I help you today?',
  videoAutoLaunch: false,
  smsNumber: '+1 (555) 234-5679',
  callbackFormFields: ['name', 'phone', 'email', 'interest'],
};

export interface WidgetAppearance {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  organizationName: string;
  showLogo: boolean;
  position: WidgetPosition;
  animation: WidgetAnimation;
  buttonLabel: string;
  welcomeHeading: string;
  welcomeMessage: string;
}

export interface WidgetTargeting {
  audience: AudienceType;
  includePages: string;
  excludePages: string;
  desktop: boolean;
  mobile: boolean;
  tablet: boolean;
  businessHoursOnly: boolean;
  delaySeconds: number;
  scrollDepthPercent: number;
  exitIntent: boolean;
}

export interface IndividualWidget {
  id: string;
  type: WidgetType;
  widgetCode: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  appearance: WidgetAppearance;
  targeting: WidgetTargeting;
  allowedDomains: string[];
  config: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  impressions: number;
  interactions: number;
}

export interface LandingPage {
  id: string;
  slug: string;
  name: string;
  type: LandingPageType;
  linkedWidgetId: string;
  status: 'active' | 'inactive' | 'draft';
  appearance: {
    headerColor: string;
    backgroundColor: string;
    heading: string;
    subheading: string;
  };
  createdAt: string;
  updatedAt: string;
  views: number;
  conversions: number;
}

export const widgetTypeConfig: Record<WidgetType, { label: string; description: string; icon: string; gradient: string }> = {
  text: { label: 'Text Chat Widget', description: 'AI-powered text chat for customer inquiries', icon: 'MessageSquare', gradient: 'from-blue-500/15 to-cyan-500/5' },
  video: { label: 'Live Video Widget', description: 'Face-to-face video chat via Tavus AI persona', icon: 'Video', gradient: 'from-purple-500/15 to-violet-500/5' },
  voice: { label: 'Voice Call Widget', description: 'Browser-based voice calls via VAPI', icon: 'Mic', gradient: 'from-emerald-500/15 to-teal-500/5' },
  unified: { label: 'Unified Widget', description: 'All channels in one — chat, video, voice, SMS, callback', icon: 'LayoutGrid', gradient: 'from-amber-500/15 to-orange-500/5' },
};

const defaultAppearance: WidgetAppearance = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#3b82f6',
  textColor: '#ffffff',
  backgroundColor: '#ffffff',
  organizationName: 'Cage Automotive',
  showLogo: true,
  position: 'bottom-right',
  animation: 'pulse',
  buttonLabel: 'Chat with us',
  welcomeHeading: 'Hi there!',
  welcomeMessage: 'How can we help you today?',
};

const defaultTargeting: WidgetTargeting = {
  audience: 'all',
  includePages: '/*',
  excludePages: '/admin/*',
  desktop: true,
  mobile: true,
  tablet: true,
  businessHoursOnly: false,
  delaySeconds: 3,
  scrollDepthPercent: 0,
  exitIntent: false,
};

export const staticWidgets: IndividualWidget[] = [
  {
    id: 'w-text',
    type: 'text',
    widgetCode: 'widget_txt_a1b2c3',
    name: 'Text Chat Widget',
    description: 'AI-powered text chat for website visitors',
    status: 'active',
    appearance: { ...defaultAppearance, primaryColor: '#3b82f6', buttonLabel: 'Chat with us' },
    targeting: defaultTargeting,
    allowedDomains: ['cageautomotive.com', '*.cageautomotive.com'],
    config: { agentName: 'Cage AI Assistant', aiInstructions: 'You are a helpful automotive sales assistant for Cage Automotive.' },
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-15T14:30:00Z',
    impressions: 12847,
    interactions: 3421,
  },
  {
    id: 'w-video',
    type: 'video',
    widgetCode: 'widget_vid_d4e5f6',
    name: 'Live Video Widget',
    description: 'Face-to-face video consultation with AI persona',
    status: 'active',
    appearance: { ...defaultAppearance, primaryColor: '#8b5cf6', buttonLabel: 'Video chat' },
    targeting: { ...defaultTargeting, delaySeconds: 5 },
    allowedDomains: ['cageautomotive.com'],
    config: { tavusPersonaId: 'tavus_persona_cage_001', tavusPersonaName: 'Sarah (AI Concierge)' },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-10T09:15:00Z',
    impressions: 5632,
    interactions: 891,
  },
  {
    id: 'w-voice',
    type: 'voice',
    widgetCode: 'widget_vox_g7h8i9',
    name: 'Voice Call Widget',
    description: 'Browser-based voice calls powered by VAPI',
    status: 'active',
    appearance: { ...defaultAppearance, primaryColor: '#10b981', buttonLabel: 'Call now' },
    targeting: { ...defaultTargeting, businessHoursOnly: true },
    allowedDomains: ['cageautomotive.com'],
    config: { vapiAssistantId: 'vapi_asst_cage_001', vapiPublicKey: 'pk_cage_live_001', phoneDisplay: '+1 (555) 234-5678' },
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-02-12T16:45:00Z',
    impressions: 3219,
    interactions: 567,
  },
  {
    id: 'w-unified',
    type: 'unified',
    widgetCode: 'widget_uni_j0k1l2',
    name: 'Unified Widget',
    description: 'All channels — chat, video, voice, SMS, callback, contact form',
    status: 'active',
    appearance: { ...defaultAppearance, primaryColor: '#8b5cf6', buttonLabel: 'Connect with us' },
    targeting: defaultTargeting,
    allowedDomains: ['cageautomotive.com', '*.cageautomotive.com'],
    config: {
      agentName: 'Cage AI Assistant',
      tavusPersonaId: 'tavus_persona_cage_001',
      vapiAssistantId: 'vapi_asst_cage_001',
      vapiPublicKey: 'pk_cage_live_001',
      phoneNumber: '+1 (555) 234-5678',
      smsNumber: '+1 (555) 234-5679',
    },
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-02-18T11:00:00Z',
    impressions: 18493,
    interactions: 6214,
  },
];

export const staticLandingPages: LandingPage[] = [
  {
    id: 'lp-1',
    slug: 'cage-auto',
    name: 'Cage Automotive Connect',
    type: 'multi',
    linkedWidgetId: 'w-unified',
    status: 'active',
    appearance: {
      headerColor: '#8b5cf6',
      backgroundColor: '#faf5ff',
      heading: 'Welcome to Cage Automotive',
      subheading: 'Choose how you\'d like to connect with us',
    },
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-02-14T11:00:00Z',
    views: 4738,
    conversions: 1247,
  },
  {
    id: 'lp-2',
    slug: 'cage-chat',
    name: 'Direct Chat Page',
    type: 'chat',
    linkedWidgetId: 'w-text',
    status: 'active',
    appearance: {
      headerColor: '#3b82f6',
      backgroundColor: '#ffffff',
      heading: 'Chat with Cage Automotive',
      subheading: 'Our AI assistant is ready to help you find the perfect vehicle',
    },
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-12T15:30:00Z',
    views: 2856,
    conversions: 912,
  },
  {
    id: 'lp-3',
    slug: 'cage-video',
    name: 'Video Consultation',
    type: 'video',
    linkedWidgetId: 'w-video',
    status: 'active',
    appearance: {
      headerColor: '#8b5cf6',
      backgroundColor: '#eff6ff',
      heading: 'Video Consultation',
      subheading: 'Speak face-to-face with our AI concierge',
    },
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-02-08T09:00:00Z',
    views: 1423,
    conversions: 298,
  },
  {
    id: 'lp-4',
    slug: 'cage-callback',
    name: 'Request Callback',
    type: 'callback',
    linkedWidgetId: 'w-voice',
    status: 'active',
    appearance: {
      headerColor: '#10b981',
      backgroundColor: '#f0fdf4',
      heading: 'Request a Callback',
      subheading: 'Leave your details and we\'ll call you right back',
    },
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
    views: 956,
    conversions: 342,
  },
  {
    id: 'lp-5',
    slug: 'cage-service',
    name: 'Service Booking',
    type: 'multi',
    linkedWidgetId: 'w-unified',
    status: 'draft',
    appearance: {
      headerColor: '#10b981',
      backgroundColor: '#ffffff',
      heading: 'Book a Service Appointment',
      subheading: 'Schedule maintenance or repairs online',
    },
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
    views: 0,
    conversions: 0,
  },
];

export function getWidgetStatusColor(status: IndividualWidget['status']): string {
  switch (status) {
    case 'active': return 'bg-emerald-500';
    case 'inactive': return 'bg-gray-400';
    case 'draft': return 'bg-amber-500';
  }
}

export function getLandingPageTypeLabel(type: LandingPageType): string {
  switch (type) {
    case 'multi': return 'Multi-Channel';
    case 'chat': return 'Chat Only';
    case 'video': return 'Video Agent';
    case 'callback': return 'Callback Form';
  }
}

export function generateWidgetEmbedCode(widget: IndividualWidget): string {
  return `<script>
  window.nexxusConfig = {
    orgId: "org-cage-auto",
    widgetId: "${widget.widgetCode}",
    type: "${widget.type}",
    position: "${widget.appearance.position}",
    primaryColor: "${widget.appearance.primaryColor}",
    greeting: "${widget.appearance.welcomeHeading}",
    message: "${widget.appearance.welcomeMessage}"
  };
</script>
<script src="https://nexxusv2.huminicdev.com/widget/nexxus-widget.js" async></script>`;
}
