export type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed';
export type CampaignChannel = 'sms' | 'email' | 'both';
export type CampaignDepartment = 'sales' | 'service' | 'marketing';

export interface CampaignMessage {
  id: string;
  order: number;
  channel: 'sms' | 'email';
  subject?: string;
  content: string;
  waitHours: number;
}

export interface Campaign {
  id: string;
  name: string;
  department: CampaignDepartment;
  status: CampaignStatus;
  channel: CampaignChannel;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  repliedCount: number;
  csvFileName?: string;
  messages: CampaignMessage[];
  killSwitch: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Service Reminder - February',
    department: 'service',
    status: 'active',
    channel: 'sms',
    recipientCount: 145,
    sentCount: 132,
    deliveredCount: 128,
    repliedCount: 47,
    csvFileName: 'feb_service_due.csv',
    messages: [
      { id: 'cm-1', order: 1, channel: 'sms', content: 'Hi {{first_name}}! Your {{vehicle}} is due for its {{service_type}} service. Would you like to schedule an appointment?', waitHours: 0 },
      { id: 'cm-2', order: 2, channel: 'sms', content: 'Just a friendly reminder - your {{service_type}} service is coming up. We have openings this week! Reply YES to book.', waitHours: 48 },
      { id: 'cm-3', order: 3, channel: 'sms', content: 'Last chance to take advantage of our February service special - 15% off {{service_type}}. Call us or reply to schedule.', waitHours: 72 },
    ],
    killSwitch: false,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-18T14:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'camp-2',
    name: 'Presidents Day Sale',
    department: 'marketing',
    status: 'completed',
    channel: 'both',
    recipientCount: 892,
    sentCount: 892,
    deliveredCount: 856,
    repliedCount: 123,
    csvFileName: 'marketing_list_feb.csv',
    messages: [
      { id: 'cm-4', order: 1, channel: 'email', subject: 'Presidents Day Sale - Up to $5,000 Off!', content: 'Dear {{first_name}}, dont miss our biggest sale of the year...', waitHours: 0 },
      { id: 'cm-5', order: 2, channel: 'sms', content: '{{first_name}}, our Presidents Day sale ends Monday! Up to $5K off select models. Visit us or call {{dealer_phone}}.', waitHours: 24 },
    ],
    killSwitch: false,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-17T23:59:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'camp-3',
    name: 'New Lead Follow-Up Sequence',
    department: 'sales',
    status: 'active',
    channel: 'both',
    recipientCount: 67,
    sentCount: 45,
    deliveredCount: 43,
    repliedCount: 18,
    messages: [
      { id: 'cm-6', order: 1, channel: 'email', subject: 'Thanks for your interest in {{vehicle}}', content: 'Hi {{first_name}}, thank you for reaching out about the {{vehicle}}. I wanted to personally follow up...', waitHours: 0 },
      { id: 'cm-7', order: 2, channel: 'sms', content: 'Hi {{first_name}}, this is {{persona_name}} from {{dealer_name}}. Did you get a chance to look at the {{vehicle}} details I sent?', waitHours: 4 },
      { id: 'cm-8', order: 3, channel: 'email', subject: 'Special pricing available - {{vehicle}}', content: 'Hi {{first_name}}, I wanted to let you know we have some special pricing available on the {{vehicle}}...', waitHours: 48 },
      { id: 'cm-9', order: 4, channel: 'sms', content: '{{first_name}}, just checking in one more time about the {{vehicle}}. Would you like to schedule a test drive? Reply STOP to opt out.', waitHours: 72 },
    ],
    killSwitch: false,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'camp-4',
    name: 'Oil Change Reminder',
    department: 'service',
    status: 'paused',
    channel: 'sms',
    recipientCount: 234,
    sentCount: 89,
    deliveredCount: 85,
    repliedCount: 31,
    csvFileName: 'oil_change_due_march.csv',
    messages: [
      { id: 'cm-10', order: 1, channel: 'sms', content: 'Hi {{first_name}}! Its time for your {{vehicle}} oil change. Book online or reply to schedule. {{dealer_name}}', waitHours: 0 },
      { id: 'cm-11', order: 2, channel: 'sms', content: 'Reminder: Your oil change is overdue. Regular maintenance protects your investment. Call us at {{dealer_phone}}.', waitHours: 168 },
    ],
    killSwitch: true,
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-02-19T16:00:00Z',
    createdBy: 'user-1',
  },
];

export const getCampaignsByDepartment = (department: CampaignDepartment): Campaign[] => {
  return mockCampaigns.filter(c => c.department === department);
};
