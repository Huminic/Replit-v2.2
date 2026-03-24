/**
 * Profile Page — User account management with tab navigation.
 *
 * Tabs:
 * - My Profile: User avatar, name, email, role badge, org badge, contact info form.
 *   Edit Profile button is demo-only (shows toast).
 * - Preferences: Appearance (dark mode toggle), notification settings (push, email digest),
 *   regional settings (language, timezone).
 *
 * Note: Billing was moved to the Management page (BillingDashboard component) in S-6.
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
  Mail,
  Phone,
  Building2,
  Shield,
  Bell,
  Moon,
  Globe,
  Clock,
  Loader2,
  Camera,
  RotateCcw,
  Lock
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { getRoleLabel } from '@/lib/agent-utils';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getAccessToken } from '@/lib/tokenStore';

export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, currentOrganization, updateCurrentUser, setShowTour } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changePwForm, setChangePwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/auth/change-password', data);
      return res.json();
    },
    onSuccess: () => {
      setChangePwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password changed', description: 'Your password has been changed successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to change password', description: err.message || 'An error occurred', variant: 'destructive' });
    },
  });

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
      const token = getAccessToken();
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={changePwForm.currentPassword} onChange={e => setChangePwForm(f => ({ ...f, currentPassword: e.target.value }))} data-testid="input-current-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={changePwForm.newPassword} onChange={e => setChangePwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Minimum 6 characters" data-testid="input-new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={changePwForm.confirmPassword} onChange={e => setChangePwForm(f => ({ ...f, confirmPassword: e.target.value }))} data-testid="input-confirm-password" />
                  </div>
                  {changePwForm.newPassword && changePwForm.confirmPassword && changePwForm.newPassword !== changePwForm.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                  <Button
                    onClick={() => changePasswordMutation.mutate({ currentPassword: changePwForm.currentPassword, newPassword: changePwForm.newPassword })}
                    disabled={changePasswordMutation.isPending || !changePwForm.currentPassword || changePwForm.newPassword.length < 6 || changePwForm.newPassword !== changePwForm.confirmPassword}
                    data-testid="button-submit-change-pw"
                  >
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Product Tour</CardTitle>
                  <CardDescription>Restart the guided walkthrough of Nexxus Connect</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTour(true);
                      toast({ title: 'Tour restarted', description: 'The product tour will begin on the next page you visit.' });
                    }}
                    data-testid="button-restart-tour"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Tour
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

      </Tabs>
    </div>
  );
}
