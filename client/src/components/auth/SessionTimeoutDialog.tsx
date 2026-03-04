/**
 * Session Timeout Warning Dialog
 *
 * Shown 2 minutes before an idle session is automatically logged out.
 * Uses the existing shadcn Dialog component.
 * Adapted for production: uses useSessionTimeout hook + useAuth for logout.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuth } from '@/contexts/AuthContext';

export function SessionTimeoutDialog() {
  const { showWarning, remainingSeconds, dismissWarning } = useSessionTimeout();
  const { logout } = useAuth();

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const handleLogOut = async () => {
    await logout();
    window.location.href = '/login?expired=true';
  };

  return (
    <Dialog open={showWarning}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <DialogTitle className="text-center">Session Expiring</DialogTitle>
          <DialogDescription className="text-center">
            Your session will expire due to inactivity. You will be logged out in{' '}
            <span className="font-semibold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={dismissWarning} className="w-full sm:w-auto">
            Stay Logged In
          </Button>
          <Button variant="outline" onClick={handleLogOut} className="w-full sm:w-auto">
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
