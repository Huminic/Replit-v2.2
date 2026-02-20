export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetAnimation = 'pulse' | 'bounce' | 'none';
export type LandingPageType = 'multi' | 'chat' | 'video' | 'callback';
export type AudienceType = 'all' | 'leads' | 'returning';

export interface ChannelConfig {
  textChat: { enabled: boolean; displayName: string };
  videoAgent: { enabled: boolean; displayName: string; personaId: string };
  callUs: { enabled: boolean; displayName: string; phoneNumber: string };
  callYou: { enabled: boolean; displayName: string; assistantId: string };
  webAudio: { enabled: boolean; displayName: string; assistantId: string; publicKey: string };
  sendText: { enabled: boolean; displayName: string };
}

export interface AppearanceConfig {
  colorTheme: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
  };
  branding: {
    logoUrl: string;
    showLogo: boolean;
    organizationName: string;
  };
  minimizedState: {
    position: WidgetPosition;
    animation: WidgetAnimation;
    icon: string;
    label: string;
  };
  welcomeScreen: {
    heading: string;
    message: string;
    avatarUrl: string;
    ctaText: string;
  };
}

export interface TargetingConfig {
  audience: AudienceType;
  pageRules: {
    include: string[];
    exclude: string[];
  };
  deviceTargeting: {
    desktop: boolean;
    mobile: boolean;
    tablet: boolean;
  };
  businessHoursOnly: boolean;
  behaviorTriggers: {
    delaySeconds: number;
    scrollDepthPercent: number;
    exitIntent: boolean;
    idleSeconds: number;
  };
}

export interface WidgetConfig {
  id: string;
  widgetCode: string;
  name: string;
  organizationId: string;
  status: 'active' | 'inactive' | 'draft';
  appearance: AppearanceConfig;
  channels: ChannelConfig;
  targeting: TargetingConfig;
  allowedDomains: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LandingPage {
  id: string;
  slug: string;
  name: string;
  type: LandingPageType;
  widgetConfigId: string;
  status: 'active' | 'inactive' | 'draft';
  appearance: {
    headerColor: string;
    logoUrl: string;
    backgroundColor: string;
    heading: string;
    subheading: string;
  };
  createdAt: string;
  updatedAt: string;
  views: number;
  conversions: number;
}

export const defaultChannels: ChannelConfig = {
  textChat: { enabled: true, displayName: 'Chat Now' },
  videoAgent: { enabled: false, displayName: 'Video Agent', personaId: '' },
  callUs: { enabled: false, displayName: 'Call Us', phoneNumber: '' },
  callYou: { enabled: false, displayName: 'Call Me Back', assistantId: '' },
  webAudio: { enabled: false, displayName: 'Voice Agent', assistantId: '', publicKey: '' },
  sendText: { enabled: false, displayName: 'Send Text' },
};

export const defaultAppearance: AppearanceConfig = {
  colorTheme: {
    primaryColor: '#0070f3',
    secondaryColor: '#7928ca',
    textColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  branding: {
    logoUrl: '',
    showLogo: true,
    organizationName: '',
  },
  minimizedState: {
    position: 'bottom-right',
    animation: 'pulse',
    icon: 'chat',
    label: 'Chat with us',
  },
  welcomeScreen: {
    heading: 'Hi there!',
    message: 'How can we help you today?',
    avatarUrl: '',
    ctaText: 'Start a conversation',
  },
};

export const defaultTargeting: TargetingConfig = {
  audience: 'all',
  pageRules: { include: [], exclude: [] },
  deviceTargeting: { desktop: true, mobile: true, tablet: true },
  businessHoursOnly: false,
  behaviorTriggers: {
    delaySeconds: 0,
    scrollDepthPercent: 0,
    exitIntent: false,
    idleSeconds: 0,
  },
};

export const mockWidgetConfigs: WidgetConfig[] = [
  {
    id: 'widget-1',
    widgetCode: 'widget_a1b2c3d4',
    name: 'Main Website Widget',
    organizationId: 'org-1',
    status: 'active',
    appearance: {
      colorTheme: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#3b82f6',
        textColor: '#ffffff',
        backgroundColor: '#ffffff',
      },
      branding: {
        logoUrl: '',
        showLogo: true,
        organizationName: 'Cage Automotive',
      },
      minimizedState: {
        position: 'bottom-right',
        animation: 'pulse',
        icon: 'chat',
        label: 'Chat with us',
      },
      welcomeScreen: {
        heading: 'Welcome to Cage Automotive!',
        message: 'How can we help you today?',
        avatarUrl: '',
        ctaText: 'Start chatting',
      },
    },
    channels: {
      textChat: { enabled: true, displayName: 'Chat Now' },
      videoAgent: { enabled: true, displayName: 'Video Agent', personaId: 'tavus_persona_123' },
      callUs: { enabled: true, displayName: 'Call Us', phoneNumber: '+1-555-0100' },
      callYou: { enabled: false, displayName: 'Call Me Back', assistantId: '' },
      webAudio: { enabled: false, displayName: 'Voice Agent', assistantId: '', publicKey: '' },
      sendText: { enabled: true, displayName: 'Send Text' },
    },
    targeting: {
      audience: 'all',
      pageRules: { include: ['/*'], exclude: ['/admin/*'] },
      deviceTargeting: { desktop: true, mobile: true, tablet: true },
      businessHoursOnly: false,
      behaviorTriggers: { delaySeconds: 3, scrollDepthPercent: 0, exitIntent: false, idleSeconds: 0 },
    },
    allowedDomains: ['cageautomotive.com', '*.cageautomotive.com'],
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-15T14:30:00Z',
  },
  {
    id: 'widget-2',
    widgetCode: 'widget_e5f6g7h8',
    name: 'Service Department Widget',
    organizationId: 'org-1',
    status: 'active',
    appearance: {
      colorTheme: {
        primaryColor: '#10b981',
        secondaryColor: '#059669',
        textColor: '#ffffff',
        backgroundColor: '#f0fdf4',
      },
      branding: {
        logoUrl: '',
        showLogo: true,
        organizationName: 'Cage Automotive Service',
      },
      minimizedState: {
        position: 'bottom-right',
        animation: 'pulse',
        icon: 'wrench',
        label: 'Need service help?',
      },
      welcomeScreen: {
        heading: 'Service Department',
        message: 'Schedule an appointment or ask about your vehicle.',
        avatarUrl: '',
        ctaText: 'Get help now',
      },
    },
    channels: {
      textChat: { enabled: true, displayName: 'Chat Now' },
      videoAgent: { enabled: false, displayName: 'Video Agent', personaId: '' },
      callUs: { enabled: true, displayName: 'Call Service', phoneNumber: '+1-555-0101' },
      callYou: { enabled: true, displayName: 'Request Callback', assistantId: 'vapi_svc_456' },
      webAudio: { enabled: false, displayName: 'Voice Agent', assistantId: '', publicKey: '' },
      sendText: { enabled: false, displayName: 'Send Text' },
    },
    targeting: {
      audience: 'all',
      pageRules: { include: ['/service/*'], exclude: [] },
      deviceTargeting: { desktop: true, mobile: true, tablet: true },
      businessHoursOnly: true,
      behaviorTriggers: { delaySeconds: 5, scrollDepthPercent: 30, exitIntent: true, idleSeconds: 0 },
    },
    allowedDomains: ['cageautomotive.com'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-10T09:15:00Z',
  },
  {
    id: 'widget-3',
    widgetCode: 'widget_i9j0k1l2',
    name: 'After Hours Bot',
    organizationId: 'org-1',
    status: 'draft',
    appearance: {
      ...defaultAppearance,
      colorTheme: {
        primaryColor: '#6366f1',
        secondaryColor: '#818cf8',
        textColor: '#ffffff',
        backgroundColor: '#eef2ff',
      },
      branding: {
        logoUrl: '',
        showLogo: false,
        organizationName: 'Cage Automotive',
      },
      welcomeScreen: {
        heading: 'We\'re currently closed',
        message: 'Leave us a message and we\'ll get back to you!',
        avatarUrl: '',
        ctaText: 'Leave a message',
      },
    },
    channels: {
      ...defaultChannels,
      callYou: { enabled: true, displayName: 'Request Callback', assistantId: '' },
      sendText: { enabled: true, displayName: 'Text Us' },
    },
    targeting: defaultTargeting,
    allowedDomains: [],
    createdAt: '2026-02-01T16:00:00Z',
    updatedAt: '2026-02-01T16:00:00Z',
  },
];

export const mockLandingPages: LandingPage[] = [
  {
    id: 'lp-1',
    slug: 'cage-auto',
    name: 'Cage Automotive Chat',
    type: 'multi',
    widgetConfigId: 'widget-1',
    status: 'active',
    appearance: {
      headerColor: '#8b5cf6',
      logoUrl: '',
      backgroundColor: '#faf5ff',
      heading: 'Welcome to Cage Automotive',
      subheading: 'Choose how you\'d like to connect with us',
    },
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-02-14T11:00:00Z',
    views: 1247,
    conversions: 389,
  },
  {
    id: 'lp-2',
    slug: 'cage-chat',
    name: 'Direct Chat',
    type: 'chat',
    widgetConfigId: 'widget-1',
    status: 'active',
    appearance: {
      headerColor: '#8b5cf6',
      logoUrl: '',
      backgroundColor: '#ffffff',
      heading: 'Chat with Cage Automotive',
      subheading: 'Our AI assistant is ready to help',
    },
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-12T15:30:00Z',
    views: 856,
    conversions: 312,
  },
  {
    id: 'lp-3',
    slug: 'cage-video',
    name: 'Video Consultation',
    type: 'video',
    widgetConfigId: 'widget-1',
    status: 'active',
    appearance: {
      headerColor: '#3b82f6',
      logoUrl: '',
      backgroundColor: '#eff6ff',
      heading: 'Video Consultation',
      subheading: 'Speak face-to-face with our AI agent',
    },
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-02-08T09:00:00Z',
    views: 423,
    conversions: 98,
  },
  {
    id: 'lp-4',
    slug: 'cage-callback',
    name: 'Request Callback',
    type: 'callback',
    widgetConfigId: 'widget-2',
    status: 'inactive',
    appearance: {
      headerColor: '#10b981',
      logoUrl: '',
      backgroundColor: '#f0fdf4',
      heading: 'Request a Callback',
      subheading: 'Leave your details and we\'ll call you back',
    },
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
    views: 156,
    conversions: 42,
  },
  {
    id: 'lp-5',
    slug: 'cage-service',
    name: 'Service Booking',
    type: 'multi',
    widgetConfigId: 'widget-2',
    status: 'draft',
    appearance: {
      headerColor: '#10b981',
      logoUrl: '',
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

export function getWidgetStatusColor(status: WidgetConfig['status']): string {
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

export function getEnabledChannelCount(channels: ChannelConfig): number {
  return Object.values(channels).filter(ch => ch.enabled).length;
}

export function generateEmbedCode(widget: WidgetConfig): string {
  return `<script>
  window.nexxusConfig = {
    orgId: "${widget.organizationId}",
    widgetId: "${widget.widgetCode}",
    position: "${widget.appearance.minimizedState.position}",
    primaryColor: "${widget.appearance.colorTheme.primaryColor}",
    greeting: "${widget.appearance.welcomeScreen.heading}",
    message: "${widget.appearance.welcomeScreen.message}"
  };
</script>
<script src="https://nexxusv2.huminicdev.com/widget/nexxus-widget.js" async></script>`;
}
