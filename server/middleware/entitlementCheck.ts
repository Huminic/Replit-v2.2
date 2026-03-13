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
      if (process.env.ENTITLEMENT_FAIL_OPEN === 'true') {
        console.warn('[Entitlement] ENTITLEMENT_FAIL_OPEN=true, allowing action despite error');
        return next();
      }
      return res.status(503).json({
        error: 'entitlement_check_unavailable',
        message: 'Unable to verify entitlement. Please try again later.',
      });
    }
  };
}
