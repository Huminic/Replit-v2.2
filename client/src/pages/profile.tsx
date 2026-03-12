/**
 * Profile Page — User account management with tab navigation.
 *
 * Tabs:
 * - My Profile: User avatar, name, email, role badge, org badge, contact info form.
 *   Edit Profile button is demo-only (shows toast).
 * - Preferences: Appearance (dark mode toggle), notification settings (push, email digest),
 *   regional settings (language, timezone).
 * - Billing: Current plan display, usage meters (voice/video/SMS/documents with Progress bars),
 *   overage calculations, add-ons table, invoice history.
 *   Falls back to "Billing not enabled" card when billingEnabled is false.
 *
 * Data sources:
 * - currentUser and currentOrganization from AppContext
 * - getRoleLabel from mocks/users.ts for role display
 *
 * @see client/src/contexts/AppContext.tsx — currentUser, currentOrganization
 */
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  User, 
  Settings, 
  CreditCard,
  Mail,
  Phone,
  Building2,
  Shield,
  Bell,
  Moon,
  Globe,
  Clock,
  Eye,
  Mic,
  Video,
  MessageCircle,
  FileText,
  Loader2,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { getRoleLabel } from '@/lib/agent-utils';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, currentOrganization, updateCurrentUser } = useApp();
  const [billingEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  const profileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; email?: string }) => {
      await apiRequest('PATCH', '/api/users/me', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      const newName = [data.firstName, data.lastName].filter(Boolean).join(' ');
      updateCurrentUser({
        ...(newName ? { name: newName } : {}),
        ...(data.email ? { email: data.email } : {}),
      });
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save profile changes.', variant: 'destructive' });
    },
  });

  const handleEditProfile = () => {
    const nameParts = currentUser.name.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(currentUser.email);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    profileMutation.mutate({
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 500 * 1024) {
      toast({ title: 'File too large', description: 'Photo must be under 500KB.', variant: 'destructive' });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const token = localStorage.getItem('nexxus_access_token');
      const res = await fetch('/api/users/me/photo', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateCurrentUser({ profilePhotoUrl: data.profilePhotoUrl });
      toast({ title: 'Photo updated', description: 'Your profile photo has been saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to upload photo.', variant: 'destructive' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [location] = useLocation();
  const getTabFromPath = () => {
    if (location.includes('/profile/preferences')) return 'preferences';
    if (location.includes('/profile/billing')) return 'billing';
    return 'profile';
  };
  const [activeProfileTab, setActiveProfileTab] = useState(getTabFromPath);

  useEffect(() => {
    setActiveProfileTab(getTabFromPath());
  }, [location]);

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-4xl p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="px-4 py-2 lg:hidden w-full max-w-4xl">
        <MobileNavDropdown currentPath="/profile" currentLabel="Profile" />
      </div>

      <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="flex-1 flex flex-col overflow-hidden w-full max-w-4xl">
        <div className="px-4 border-b border-border hidden lg:flex items-center">
          <TabsList className="bg-transparent h-10 p-0 gap-4 flex-shrink-0">
            <TabsTrigger value="profile" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-profile-main">
              <User className="h-4 w-4" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-profile-preferences">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-profile-billing">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-2xl">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative group">
                      <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-photo">
                        {currentUser.profilePhotoUrl ? (
                          <AvatarImage src={currentUser.profilePhotoUrl} alt={currentUser.name} data-testid="img-avatar" />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-none">
                        {isUploadingPhoto ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="edit-first-name">First Name</Label>
                              <Input id="edit-first-name" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} data-testid="input-first-name" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="edit-last-name">Last Name</Label>
                              <Input id="edit-last-name" value={editLastName} onChange={e => setEditLastName(e.target.value)} data-testid="input-last-name" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" value={editEmail} onChange={e => setEditEmail(e.target.value)} data-testid="input-edit-email" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl font-semibold text-foreground">{currentUser.name}</h2>
                          <p className="text-muted-foreground">{currentUser.email}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {getRoleLabel(currentUser.role)}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="h-3 w-3" />
                              {currentOrganization.name}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile} disabled={profileMutation.isPending} data-testid="button-save-profile">
                          {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={handleEditProfile} data-testid="button-edit-profile">Edit Profile</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input id="email" defaultValue={currentUser.email} data-testid="input-email" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Input id="phone" defaultValue="+1 (555) 123-4567" data-testid="input-phone" />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const emailInput = document.getElementById('email') as HTMLInputElement;
                      const nameParts = currentUser.name.split(' ');
                      profileMutation.mutate({
                        email: emailInput?.value || currentUser.email,
                        firstName: nameParts[0],
                        lastName: nameParts.slice(1).join(' '),
                      });
                    }}
                    disabled={profileMutation.isPending}
                    data-testid="button-save-contact"
                  >
                    {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preferences" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Appearance</CardTitle>
                  <CardDescription>Customize how Nexxus looks on your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                    </div>
                    <Switch data-testid="switch-dark-mode" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <CardDescription>Choose what you want to be notified about</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive push notifications</p>
                      </div>
                    </div>
                    <Switch defaultChecked data-testid="switch-push-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email Digest</p>
                        <p className="text-sm text-muted-foreground">Receive daily email summary</p>
                      </div>
                    </div>
                    <Switch data-testid="switch-email-digest" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Regional Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger data-testid="select-language">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select defaultValue="pst">
                        <SelectTrigger data-testid="select-timezone">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                          <SelectItem value="est">Eastern Time (EST)</SelectItem>
                          <SelectItem value="utc">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="billing" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-2xl">
              {billingEnabled ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-semibold text-foreground" data-testid="text-plan-name">Pro Plan</p>
                          <p className="text-sm text-muted-foreground">Base Monthly Fee: $99/month</p>
                        </div>
                        <Badge data-testid="badge-plan-status">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Anniversary Date</span>
                          <p className="font-medium text-foreground" data-testid="text-anniversary-date">March 15</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Invoice</span>
                          <p className="font-medium text-foreground" data-testid="text-next-invoice">March 15, 2026</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Usage This Period</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Voice</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">847 / 1,000 minutes</span>
                            <span className="font-medium text-foreground" data-testid="text-voice-usage">85%</span>
                          </div>
                          <Progress value={85} className="h-2" data-testid="progress-voice" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Video</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">123 / 500 minutes</span>
                            <span className="font-medium text-foreground" data-testid="text-video-usage">25%</span>
                          </div>
                          <Progress value={25} className="h-2" data-testid="progress-video" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">SMS</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">2,340 msgs</span>
                            <span className="font-medium text-foreground" data-testid="text-sms-usage">65%</span>
                          </div>
                          <Progress value={65} className="h-2" data-testid="progress-sms" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Documents</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">89 docs</span>
                            <span className="font-medium text-foreground" data-testid="text-docs-usage">10%</span>
                          </div>
                          <Progress value={10} className="h-2" data-testid="progress-documents" />
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-muted-foreground">Overage</span>
                      <span className="font-medium text-foreground" data-testid="text-overage">$12.50 <span className="text-muted-foreground font-normal">(voice: 47 min x $0.25 + markup)</span></span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Add-Ons This Period</h3>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Recurring</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow data-testid="row-addon-sms">
                            <TableCell className="text-foreground">Extra SMS bundle</TableCell>
                            <TableCell className="text-foreground">$25</TableCell>
                            <TableCell><Badge variant="secondary">Monthly</Badge></TableCell>
                          </TableRow>
                          <TableRow data-testid="row-addon-setup">
                            <TableCell className="text-foreground">Setup fee</TableCell>
                            <TableCell className="text-foreground">$150</TableCell>
                            <TableCell><Badge variant="outline">One-time</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Invoice History</h3>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">View</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow data-testid="row-invoice-feb">
                            <TableCell className="text-foreground">Feb 15</TableCell>
                            <TableCell className="text-foreground">$136.50</TableCell>
                            <TableCell><Badge variant="secondary">Sent</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => toast({ title: 'View invoice', description: 'Invoice viewing is not available in demo mode.' })} data-testid="button-view-invoice-feb">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow data-testid="row-invoice-jan">
                            <TableCell className="text-foreground">Jan 15</TableCell>
                            <TableCell className="text-foreground">$124.00</TableCell>
                            <TableCell><Badge>Paid</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => toast({ title: 'View invoice', description: 'Invoice viewing is not available in demo mode.' })} data-testid="button-view-invoice-jan">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-foreground font-medium" data-testid="text-billing-disabled">Billing is not enabled for this organization.</p>
                      <p className="text-sm text-muted-foreground mt-1">Contact your administrator for more information.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
