import { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/billingService';
import { storage } from '../storage';

export function requireEntitlement(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.organizationId) return next();

      const org = await storage.getOrganization(user.organizationId);
      if (!org?.billingCustomerId) return next();

      const check = await billingService.checkEntitlement(org.billingCustomerId, featureKey);
      if (!check.allowed) {
        return res.status(403).json({
          error: 'entitlement_exceeded',
          feature: featureKey,
          limit: check.limit,
          used: check.used,
          upgradeUrl: '/settings/billing/plan'
        });
      }
      next();
    } catch (err) {
      console.error('[Entitlement] Check failed:', err);
      if (process.env.ENTITLEMENT_FAIL_CLOSED === 'true') {
        // Only block when explicitly configured to fail closed
        return res.status(503).json({
          error: 'entitlement_check_unavailable',
          message: 'Unable to verify entitlement. Please try again later.',
        });
      }
      // Default: fail open — allow the action when billing service is unreachable
      console.warn(`[Entitlement] Billing service unreachable for ${featureKey} — failing open (allowing action)`);
      return next();
    }
  };
}
