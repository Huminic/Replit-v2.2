/**
 * index.ts — Central barrel export for all mock data modules
 *
 * Re-exports everything from all mock files so consumers can import from '@/mocks'.
 * Note: conversations.ts and campaigns.ts and widgets.ts are NOT included here —
 * they are imported directly where needed (teambox.tsx, service.tsx, marketing.tsx,
 * settings.tsx, widget-landing.tsx).
 *
 * PRODUCTION NOTE: When backend APIs are wired up, these mock imports will be
 * replaced with API calls via @tanstack/react-query. The type definitions will
 * move to shared/schema.ts.
 */
export * from './users';
export * from './agents';
export * from './messages';
export * from './notifications';
export * from './activity';
export * from './files';
export * from './tasks';
export * from './insights';
