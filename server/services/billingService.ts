const METERS = [
  { id: "voice_minute", name: "Voice Minutes", aggregation: "SUM", property: "minutes" },
  { id: "video_minute", name: "Video Minutes", aggregation: "SUM", property: "minutes" },
  { id: "sms_sent", name: "SMS Sent", aggregation: "COUNT", property: null },
  { id: "llm_input_tokens", name: "LLM Input Tokens", aggregation: "SUM", property: "tokens" },
  { id: "llm_output_tokens", name: "LLM Output Tokens", aggregation: "SUM", property: "tokens" },
  { id: "image_generated", name: "Images Generated", aggregation: "COUNT", property: null },
  { id: "video_generated", name: "Video Generated", aggregation: "SUM", property: "seconds" },
];

class BillingService {
  private apiKey: string;
  private baseUrl: string;
  private entitlementCache: Map<string, { data: any; expires: number }>;
  private planCache: Map<string, { data: any; expires: number }>;

  constructor() {
    this.apiKey = process.env.FLEXPRICE_API_KEY || "";
    this.baseUrl = process.env.FLEXPRICE_BASE_URL || "https://api.cloud.flexprice.io/v1";
    this.entitlementCache = new Map();
    this.planCache = new Map();
  }

  private get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    if (!this.isConfigured) return null;
    try {
      const url = `${this.baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      if (!response.ok) {
        console.log(`[Billing] ${method} ${path} returned ${response.status}: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.log(`[Billing] ${method} ${path} error: ${err.message}`);
      return null;
    }
  }

  async getCustomerByOrgId(orgId: string): Promise<any> {
    if (!this.isConfigured) return null;
    try {
      const data = await this.request("GET", `/customers?external_id=${encodeURIComponent(orgId)}`);
      if (!data) return null;
      const items = data.items || data;
      return Array.isArray(items) && items.length > 0 ? items[0] : null;
    } catch (err: any) {
      console.log(`[Billing] getCustomerByOrgId error: ${err.message}`);
      return null;
    }
  }

  async getSubscription(customerId: string): Promise<any> {
    if (!this.isConfigured) return null;
    try {
      const data = await this.request("GET", `/subscriptions?customer_id=${encodeURIComponent(customerId)}`);
      if (!data) return null;
      const items = data.items || data;
      if (!Array.isArray(items)) return null;
      const active = items.find((s: any) => s.status === "active") || items[0];
      return active || null;
    } catch (err: any) {
      console.log(`[Billing] getSubscription error: ${err.message}`);
      return null;
    }
  }

  async checkEntitlement(customerId: string, featureKey: string): Promise<{ allowed: boolean; limit?: number; used?: number }> {
    if (!this.isConfigured) return { allowed: true };
    const cacheKey = `${customerId}:${featureKey}`;
    const cached = this.entitlementCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    try {
      const data = await this.request("POST", "/entitlements/check", {
        customer_id: customerId,
        feature_key: featureKey,
      });
      if (!data) {
        if (cached) {
          console.log(`[Billing] FlexPrice unreachable for ${featureKey} — using stale cached entitlement`);
          return cached.data;
        }
        console.log(`[Billing] FlexPrice unreachable for ${featureKey} — failing closed (no cache)`);
        return { allowed: false };
      }
      const result = {
        allowed: data.allowed !== false,
        limit: data.limit != null ? Number(data.limit) : undefined,
        used: data.used != null ? Number(data.used) : undefined,
      };
      this.entitlementCache.set(cacheKey, { data: result, expires: Date.now() + 5 * 60 * 1000 });
      return result;
    } catch (err: any) {
      console.log(`[Billing] checkEntitlement error: ${err.message}`);
      if (cached) {
        console.log(`[Billing] Using stale cached entitlement for ${featureKey}`);
        return cached.data;
      }
      return { allowed: false };
    }
  }

  async getUsageSummary(customerId: string, startDate: string, endDate: string): Promise<any> {
    if (!this.isConfigured) return {};
    try {
      const results: Record<string, any> = {};
      for (const meter of METERS) {
        const usage = await this.getMeterUsage(meter.id, customerId, startDate, endDate);
        results[meter.id] = {
          name: meter.name,
          value: usage?.value ?? 0,
          aggregation: meter.aggregation,
        };
      }
      return results;
    } catch (err: any) {
      console.log(`[Billing] getUsageSummary error: ${err.message}`);
      return {};
    }
  }

  async emitUsageEvent(orgId: string, eventName: string, properties: Record<string, any>): Promise<void> {
    if (!this.isConfigured) return;
    this.request("POST", "/events", {
      external_customer_id: orgId,
      event_name: eventName,
      properties,
      timestamp: new Date().toISOString(),
    }).catch((err: any) => {
      console.log(`[Billing] emitUsageEvent error: ${err.message}`);
    });
  }

  async getWalletBalance(walletId: string): Promise<{ balance: number; currency: string }> {
    if (!this.isConfigured) return { balance: 0, currency: "USD" };
    try {
      const data = await this.request("POST", `/wallets/${encodeURIComponent(walletId)}/balance`, {});
      if (!data) return { balance: 0, currency: "USD" };
      return {
        balance: data.balance != null ? Number(data.balance) : 0,
        currency: data.currency || "USD",
      };
    } catch (err: any) {
      console.log(`[Billing] getWalletBalance error: ${err.message}`);
      return { balance: 0, currency: "USD" };
    }
  }

  async topUpWallet(walletId: string, amount: number): Promise<void> {
    if (!this.isConfigured) return;
    try {
      await this.request("POST", `/wallets/${encodeURIComponent(walletId)}/topup`, { amount });
    } catch (err: any) {
      console.log(`[Billing] topUpWallet error: ${err.message}`);
    }
  }

  async getInvoices(customerId: string): Promise<any[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request("GET", `/invoices?customer_id=${encodeURIComponent(customerId)}`);
      if (!data) return [];
      return data.items || data || [];
    } catch (err: any) {
      console.log(`[Billing] getInvoices error: ${err.message}`);
      return [];
    }
  }

  async getPlans(): Promise<any[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request("GET", "/plans");
      if (!data) return [];
      const items = data.items || data || [];
      return Array.isArray(items) ? items.filter((p: any) => p.status === "published") : [];
    } catch (err: any) {
      console.log(`[Billing] getPlans error: ${err.message}`);
      return [];
    }
  }

  async getPlanDetails(planId: string): Promise<any> {
    if (!this.isConfigured) return null;
    const cached = this.planCache.get(planId);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    try {
      const data = await this.request("GET", `/plans/${encodeURIComponent(planId)}`);
      if (data) {
        this.planCache.set(planId, { data, expires: Date.now() + 60 * 60 * 1000 });
      }
      return data;
    } catch (err: any) {
      console.log(`[Billing] getPlanDetails error: ${err.message}`);
      return null;
    }
  }

  async getEntitlements(planId: string): Promise<any[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request("GET", `/entitlements?plan_id=${encodeURIComponent(planId)}`);
      if (!data) return [];
      return data.items || data || [];
    } catch (err: any) {
      console.log(`[Billing] getEntitlements error: ${err.message}`);
      return [];
    }
  }

  async getWallets(customerId: string): Promise<any[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request("GET", `/wallets?customer_id=${encodeURIComponent(customerId)}`);
      if (!data) return [];
      return data.items || data || [];
    } catch (err: any) {
      console.log(`[Billing] getWallets error: ${err.message}`);
      return [];
    }
  }

  async getMeterUsage(meterId: string, customerId: string, startDate: string, endDate: string): Promise<any> {
    if (!this.isConfigured) return null;
    try {
      const data = await this.request("POST", "/events/usage/meter", {
        meter_id: meterId,
        customer_id: customerId,
        start_date: startDate,
        end_date: endDate,
      });
      return data;
    } catch (err: any) {
      console.log(`[Billing] getMeterUsage error: ${err.message}`);
      return null;
    }
  }

  getMeters() {
    return METERS;
  }
}

export const billingService = new BillingService();
