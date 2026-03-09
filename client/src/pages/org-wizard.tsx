/**
 * Organization Wizard Page — 7-step onboarding flow for creating new organizations.
 *
 * RBAC: Restricted to super_admin and partner_admin only. Redirects other roles to /settings.
 * Route: /settings/org-wizard
 *
 * Steps:
 * 1. Org Details: Name (required), industry, size, website, logo upload, public listing toggle, multi-location.
 * 2. Contact: Primary phone (required), email (required), address, city/state/zip, timezone, business hours.
 * 3. Admin Setup: First/last name (required), email (required), phone, role (org_admin or partner_admin for super_admin),
 *    auto-generated temporary password with copy button, welcome email toggle.
 * 4. Configuration: Billing settings — billing enabled toggle, anniversary date, base monthly fee,
 *    included minutes (voice/video/SMS), overage rates (fixed display), setup fee.
 * 5. Tools: Toggle available integrations — CRM (VIN Solutions), Voice (VAPI), Video (Tavus),
 *    SMS (TextMagic), Document Generator, Email (Resend).
 * 6. Default Agent: Agent name, persona description, channel selection, auto-respond toggle,
 *    deploy immediately toggle, skill checkboxes (Lead Qualifier, Email Composer, FAQ Responder).
 * 7. Review: Summary of all steps with validation warnings. Create Organization button.
 *
 * Validation: Steps 0-2 have required field validation. Errors shown via toast on Next.
 * On create: Shows success toast and navigates to /settings/system?section=users.
 *
 * PRODUCTION NOTE: Will POST to backend API to create org, admin user, billing config, and default agent.
 *
 * @see client/src/pages/settings.tsx — User Management section links to this wizard
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Check, Copy, Upload, Building2, Phone, Mail, User, Settings,
  Wrench, Bot, ClipboardList, Users, Video, Mic, MessageSquare,
  FileText, Send as SendIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';

const STEPS = [
  { label: 'Org Details', icon: Building2 },
  { label: 'Contact', icon: Phone },
  { label: 'Admin Setup', icon: User },
  { label: 'Configuration', icon: Settings },
  { label: 'Tools', icon: Wrench },
  { label: 'Default Agent', icon: Bot },
  { label: 'Review', icon: ClipboardList },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

interface FormData {
  orgName: string;
  industry: string;
  size: string;
  website: string;
  publicListing: boolean;
  multiLocation: boolean;
  primaryPhone: string;
  primaryEmail: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminRole: string;
  tempPassword: string;
  sendWelcomeEmail: boolean;
  billingEnabled: boolean;
  anniversaryDate: string;
  baseMonthlyFee: number;
  voiceMinutes: number;
  videoMinutes: number;
  smsMessages: number;
  setupFee: number;
  tools: Record<string, boolean>;
  agentName: string;
  agentPersona: string;
  agentChannel: string;
  autoRespond: boolean;
  deployImmediately: boolean;
  skills: Record<string, boolean>;
}

const today = new Date().toISOString().split('T')[0];

const initialFormData: FormData = {
  orgName: '',
  industry: '',
  size: '',
  website: '',
  publicListing: false,
  multiLocation: false,
  primaryPhone: '',
  primaryEmail: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  timezone: '',
  businessHoursStart: '09:00',
  businessHoursEnd: '17:00',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
  adminRole: 'org_admin',
  tempPassword: generatePassword(),
  sendWelcomeEmail: true,
  billingEnabled: true,
  anniversaryDate: today,
  baseMonthlyFee: 99,
  voiceMinutes: 1000,
  videoMinutes: 500,
  smsMessages: 5000,
  setupFee: 0,
  tools: {
    crm: false,
    voice: false,
    video: false,
    sms: true,
    docgen: true,
    email: true,
  },
  agentName: 'Serra',
  agentPersona: '',
  agentChannel: 'omnichannel',
  autoRespond: true,
  deployImmediately: true,
  skills: {
    leadQualifier: true,
    emailComposer: true,
    faqResponder: true,
  },
};

const toolsList = [
  { id: 'crm', name: 'CRM Integration', tech: 'VIN Solutions', desc: 'Connect to your CRM for lead and customer data sync', icon: Users },
  { id: 'voice', name: 'Voice Calling', tech: 'VAPI', desc: 'Browser-based voice calls powered by VAPI', icon: Mic },
  { id: 'video', name: 'Video Calling', tech: 'Tavus', desc: 'Face-to-face video chat via Tavus AI persona', icon: Video },
  { id: 'sms', name: 'SMS & Text', tech: 'TextMagic', desc: 'Send SMS and text messages to customers', icon: MessageSquare },
  { id: 'docgen', name: 'Document Generator', tech: 'Document Generator', desc: 'Generate sales documents and contracts', icon: FileText },
  { id: 'email', name: 'Email', tech: 'Resend', desc: 'Send transactional and marketing emails', icon: SendIcon },
];

const skillsList = [
  { id: 'leadQualifier', name: 'Lead Qualifier' },
  { id: 'emailComposer', name: 'Email Composer' },
  { id: 'faqResponder', name: 'FAQ Responder' },
];

export default function OrgWizardPage() {
  const { currentRole } = useApp();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const isSuperAdmin = currentRole === 'super_admin';
  const isPartnerAdmin = currentRole === 'partner_admin';

  useEffect(() => {
    if (!isSuperAdmin && !isPartnerAdmin) {
      toast({ title: 'Access Denied', description: 'You do not have permission to create organizations.' });
      navigate('/settings');
    }
  }, [currentRole]);

  if (!isSuperAdmin && !isPartnerAdmin) return null;

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateTool = (toolId: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, tools: { ...prev.tools, [toolId]: checked } }));
  };

  const updateSkill = (skillId: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, skills: { ...prev.skills, [skillId]: checked } }));
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.tempPassword);
    setCopiedPassword(true);
    toast({ title: 'Copied', description: 'Temporary password copied to clipboard.' });
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    if (step === 0 && !formData.orgName.trim()) errors.push('Organization Name is required');
    if (step === 1) {
      if (!formData.primaryPhone.trim()) errors.push('Primary Phone is required');
      if (!formData.primaryEmail.trim()) errors.push('Primary Email is required');
    }
    if (step === 2) {
      if (!formData.adminFirstName.trim()) errors.push('First Name is required');
      if (!formData.adminLastName.trim()) errors.push('Last Name is required');
      if (!formData.adminEmail.trim()) errors.push('Admin Email is required');
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      toast({ title: 'Validation Error', description: errors.join(', '), variant: 'destructive' });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const createOrgMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/organizations', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Organization created successfully!', description: `${formData.orgName} has been created.` });
      navigate('/settings/system?section=users');
    },
    onError: (error: Error) => {
      const msg = error.message.includes(':') ? error.message.split(': ').slice(1).join(': ') : error.message;
      let parsed = msg;
      try {
        const obj = JSON.parse(msg);
        if (obj.message) parsed = obj.message;
      } catch {}
      toast({ title: 'Failed to create organization', description: parsed, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    const allErrors: string[] = [];
    for (let i = 0; i <= 2; i++) allErrors.push(...validateStep(i));
    if (allErrors.length > 0) {
      toast({ title: 'Missing Required Fields', description: allErrors.join(', '), variant: 'destructive' });
      return;
    }
    createOrgMutation.mutate(formData);
  };

  const getReviewWarnings = (): string[] => {
    const warnings: string[] = [];
    for (let i = 0; i <= 2; i++) warnings.push(...validateStep(i));
    return warnings;
  };

  const renderStepIndicator = () => (
    <div className="w-full overflow-x-auto py-4 px-2">
      <div className="flex items-center justify-center min-w-[600px] mx-auto max-w-3xl">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  if (i < currentStep) setCurrentStep(i);
                }}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  i < currentStep && 'bg-primary text-primary-foreground',
                  i === currentStep && 'border-2 border-primary text-primary bg-transparent',
                  i > currentStep && 'bg-muted text-muted-foreground',
                )}
                data-testid={`step-indicator-${i}`}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              <span className={cn(
                'text-[10px] whitespace-nowrap',
                i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 mt-[-16px]',
                i < currentStep ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Organization Name <span className="text-destructive">*</span></Label>
        <Input
          value={formData.orgName}
          onChange={e => updateField('orgName', e.target.value)}
          placeholder="Enter organization name"
          data-testid="input-org-name"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Industry</Label>
          <Select value={formData.industry} onValueChange={v => updateField('industry', v)}>
            <SelectTrigger data-testid="select-industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automotive">Automotive</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={formData.size} onValueChange={v => updateField('size', v)}>
            <SelectTrigger data-testid="select-size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="200+">200+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input
          value={formData.website}
          onChange={e => updateField('website', e.target.value)}
          placeholder="https://example.com"
          data-testid="input-website"
        />
      </div>
      <div className="space-y-2">
        <Label>Logo</Label>
        <div
          className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover-elevate"
          data-testid="dropzone-logo"
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Drag & drop logo or click to upload</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label>Public Listing</Label>
        <Switch
          checked={formData.publicListing}
          onCheckedChange={v => updateField('publicListing', v)}
          data-testid="switch-public-listing"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Multi-Location</Label>
        <Switch
          checked={formData.multiLocation}
          onCheckedChange={v => updateField('multiLocation', v)}
          data-testid="switch-multi-location"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Phone <span className="text-destructive">*</span></Label>
          <Input
            value={formData.primaryPhone}
            onChange={e => updateField('primaryPhone', e.target.value)}
            placeholder="(555) 123-4567"
            data-testid="input-primary-phone"
          />
        </div>
        <div className="space-y-2">
          <Label>Primary Email <span className="text-destructive">*</span></Label>
          <Input
            type="email"
            value={formData.primaryEmail}
            onChange={e => updateField('primaryEmail', e.target.value)}
            placeholder="contact@example.com"
            data-testid="input-primary-email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address Line 1</Label>
        <Input
          value={formData.address1}
          onChange={e => updateField('address1', e.target.value)}
          placeholder="123 Main St"
          data-testid="input-address1"
        />
      </div>
      <div className="space-y-2">
        <Label>Address Line 2</Label>
        <Input
          value={formData.address2}
          onChange={e => updateField('address2', e.target.value)}
          placeholder="Suite 100"
          data-testid="input-address2"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={e => updateField('city', e.target.value)}
            data-testid="input-city"
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={formData.state} onValueChange={v => updateField('state', v)}>
            <SelectTrigger data-testid="select-state">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>ZIP</Label>
          <Input
            value={formData.zip}
            onChange={e => updateField('zip', e.target.value)}
            data-testid="input-zip"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Time Zone</Label>
        <Select value={formData.timezone} onValueChange={v => updateField('timezone', v)}>
          <SelectTrigger data-testid="select-timezone">
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EST">EST</SelectItem>
            <SelectItem value="CST">CST</SelectItem>
            <SelectItem value="MST">MST</SelectItem>
            <SelectItem value="PST">PST</SelectItem>
            <SelectItem value="AKST">AKST</SelectItem>
            <SelectItem value="HST">HST</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Business Hours Start</Label>
          <Input
            type="time"
            value={formData.businessHoursStart}
            onChange={e => updateField('businessHoursStart', e.target.value)}
            data-testid="input-hours-start"
          />
        </div>
        <div className="space-y-2">
          <Label>Business Hours End</Label>
          <Input
            type="time"
            value={formData.businessHoursEnd}
            onChange={e => updateField('businessHoursEnd', e.target.value)}
            data-testid="input-hours-end"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name <span className="text-destructive">*</span></Label>
          <Input
            value={formData.adminFirstName}
            onChange={e => updateField('adminFirstName', e.target.value)}
            data-testid="input-admin-first-name"
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name <span className="text-destructive">*</span></Label>
          <Input
            value={formData.adminLastName}
            onChange={e => updateField('adminLastName', e.target.value)}
            data-testid="input-admin-last-name"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email <span className="text-destructive">*</span></Label>
          <Input
            type="email"
            value={formData.adminEmail}
            onChange={e => updateField('adminEmail', e.target.value)}
            data-testid="input-admin-email"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.adminPhone}
            onChange={e => updateField('adminPhone', e.target.value)}
            data-testid="input-admin-phone"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={formData.adminRole} onValueChange={v => updateField('adminRole', v)}>
          <SelectTrigger data-testid="select-admin-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="org_admin">Org Admin</SelectItem>
            {isSuperAdmin && <SelectItem value="partner_admin">Partner Admin</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Temporary Password</Label>
        <div className="flex items-center gap-2">
          <Input
            value={formData.tempPassword}
            readOnly
            className="font-mono"
            data-testid="input-temp-password"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyPassword}
            data-testid="button-copy-password"
          >
            {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label>Send Welcome Email</Label>
        <Switch
          checked={formData.sendWelcomeEmail}
          onCheckedChange={v => updateField('sendWelcomeEmail', v)}
          data-testid="switch-welcome-email"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Billing Enabled</Label>
        <Switch
          checked={formData.billingEnabled}
          onCheckedChange={v => updateField('billingEnabled', v)}
          data-testid="switch-billing-enabled"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Anniversary Date</Label>
          <Input
            type="date"
            value={formData.anniversaryDate}
            onChange={e => updateField('anniversaryDate', e.target.value)}
            data-testid="input-anniversary-date"
          />
        </div>
        <div className="space-y-2">
          <Label>Base Monthly Fee ($)</Label>
          <Input
            type="number"
            value={formData.baseMonthlyFee}
            onChange={e => updateField('baseMonthlyFee', Number(e.target.value))}
            data-testid="input-base-fee"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Included Minutes</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Voice</Label>
            <Input
              type="number"
              value={formData.voiceMinutes}
              onChange={e => updateField('voiceMinutes', Number(e.target.value))}
              data-testid="input-voice-minutes"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Video</Label>
            <Input
              type="number"
              value={formData.videoMinutes}
              onChange={e => updateField('videoMinutes', Number(e.target.value))}
              data-testid="input-video-minutes"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">SMS</Label>
            <Input
              type="number"
              value={formData.smsMessages}
              onChange={e => updateField('smsMessages', Number(e.target.value))}
              data-testid="input-sms-messages"
            />
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Overage Rates</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Voice</Label>
            <span className="text-sm text-foreground" data-testid="text-overage-voice">$0.25/min</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Video</Label>
            <span className="text-sm text-foreground" data-testid="text-overage-video">$0.32/min</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">SMS</Label>
            <span className="text-sm text-foreground" data-testid="text-overage-sms">$0.015/msg</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Setup Fee ($)</Label>
        <Input
          type="number"
          value={formData.setupFee}
          onChange={e => updateField('setupFee', Number(e.target.value))}
          data-testid="input-setup-fee"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-3">
      {toolsList.map(tool => {
        const Icon = tool.icon;
        return (
          <div
            key={tool.id}
            className="flex items-center gap-4 p-4 rounded-md border border-border"
            data-testid={`tool-row-${tool.id}`}
          >
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.tech} &mdash; {tool.desc}</p>
            </div>
            <Checkbox
              checked={formData.tools[tool.id]}
              onCheckedChange={(checked) => updateTool(tool.id, !!checked)}
              data-testid={`checkbox-tool-${tool.id}`}
            />
          </div>
        );
      })}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Agent Name</Label>
        <Input
          value={formData.agentName}
          onChange={e => updateField('agentName', e.target.value)}
          data-testid="input-agent-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Agent Persona</Label>
        <Textarea
          value={formData.agentPersona}
          onChange={e => updateField('agentPersona', e.target.value)}
          placeholder="Describe the agent's personality and behavior..."
          rows={4}
          data-testid="input-agent-persona"
        />
      </div>
      <div className="space-y-2">
        <Label>Channel</Label>
        <Select value={formData.agentChannel} onValueChange={v => updateField('agentChannel', v)}>
          <SelectTrigger data-testid="select-agent-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="omnichannel">Omnichannel</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Auto-Respond</Label>
        <Switch
          checked={formData.autoRespond}
          onCheckedChange={v => updateField('autoRespond', v)}
          data-testid="switch-auto-respond"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Deploy Immediately</Label>
        <Switch
          checked={formData.deployImmediately}
          onCheckedChange={v => updateField('deployImmediately', v)}
          data-testid="switch-deploy-immediately"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Skills</p>
        <div className="space-y-2">
          {skillsList.map(skill => (
            <div key={skill.id} className="flex items-center gap-3">
              <Checkbox
                checked={formData.skills[skill.id]}
                onCheckedChange={(checked) => updateSkill(skill.id, !!checked)}
                data-testid={`checkbox-skill-${skill.id}`}
              />
              <Label className="text-sm">{skill.name}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReviewSection = (title: string, items: [string, string | boolean][]) => (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm py-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep7 = () => {
    const warnings = getReviewWarnings();
    const enabledTools = toolsList.filter(t => formData.tools[t.id]).map(t => t.name).join(', ') || 'None';
    const enabledSkills = skillsList.filter(s => formData.skills[s.id]).map(s => s.name).join(', ') || 'None';

    return (
      <div className="space-y-6">
        {warnings.length > 0 && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20" data-testid="review-warnings">
            <p className="text-sm font-medium text-destructive mb-1">Missing Required Fields</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-destructive/80">{w}</p>
            ))}
          </div>
        )}

        {renderReviewSection('1. Organization Details', [
          ['Name', formData.orgName],
          ['Industry', formData.industry],
          ['Size', formData.size],
          ['Website', formData.website],
          ['Public Listing', formData.publicListing],
          ['Multi-Location', formData.multiLocation],
        ])}

        <div className="border-t border-border" />

        {renderReviewSection('2. Contact Information', [
          ['Phone', formData.primaryPhone],
          ['Email', formData.primaryEmail],
          ['Address', [formData.address1, formData.address2, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')],
          ['Time Zone', formData.timezone],
          ['Business Hours', `${formData.businessHoursStart} - ${formData.businessHoursEnd}`],
        ])}

        <div className="border-t border-border" />

        {renderReviewSection('3. Admin Setup', [
          ['Name', `${formData.adminFirstName} ${formData.adminLastName}`],
          ['Email', formData.adminEmail],
          ['Phone', formData.adminPhone],
          ['Role', formData.adminRole === 'org_admin' ? 'Org Admin' : 'Partner Admin'],
          ['Welcome Email', formData.sendWelcomeEmail],
        ])}

        <div className="border-t border-border" />

        {renderReviewSection('4. Configuration', [
          ['Billing', formData.billingEnabled],
          ['Anniversary', formData.anniversaryDate],
          ['Base Fee', `$${formData.baseMonthlyFee}`],
          ['Voice Minutes', String(formData.voiceMinutes)],
          ['Video Minutes', String(formData.videoMinutes)],
          ['SMS Messages', String(formData.smsMessages)],
          ['Setup Fee', `$${formData.setupFee}`],
        ])}

        <div className="border-t border-border" />

        {renderReviewSection('5. Tools', [
          ['Enabled Tools', enabledTools],
        ])}

        <div className="border-t border-border" />

        {renderReviewSection('6. Default Agent', [
          ['Agent Name', formData.agentName],
          ['Channel', formData.agentChannel],
          ['Auto-Respond', formData.autoRespond],
          ['Deploy Immediately', formData.deployImmediately],
          ['Skills', enabledSkills],
        ])}

        <div className="pt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleCreate}
            disabled={createOrgMutation.isPending}
            data-testid="button-create-organization"
          >
            {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </div>
    );
  };

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-4xl p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-wizard-title">New Organization</h1>
        <p className="text-sm text-muted-foreground">Create a new organization with guided setup</p>
      </div>

      <div className="px-4 py-2 lg:hidden w-full max-w-4xl">
        <MobileNavDropdown currentPath="/settings/org-wizard" currentLabel="New Organization" />
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-4xl mx-auto p-4">
          {renderStepIndicator()}

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="h-4 w-4" />; })()}
                {STEPS[currentStep].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stepRenderers[currentStep]()}
            </CardContent>
          </Card>

          {currentStep < 6 && (
            <div className="flex items-center justify-between gap-2 mt-4 pb-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                data-testid="button-back"
              >
                Back
              </Button>
              <Button onClick={handleNext} data-testid="button-next">
                Next
              </Button>
            </div>
          )}

          {currentStep === 6 && (
            <div className="flex items-center justify-start mt-4 pb-6">
              <Button variant="outline" onClick={handleBack} data-testid="button-back-review">
                Back
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}