# R-2 Infrastructure Scan Results

8 MAJOR, 15+ MINOR across dependencies, env vars, database, build config, file organization.

## MAJOR

| # | Domain | Area | Issue |
|---|--------|------|-------|
| 1 | IN | Dependencies | 5 unused passport/session packages (dead auth stack): connect-pg-simple, express-session, memorystore, passport, passport-local |
| 2 | IN | Security | 5 npm audit vulnerabilities (3 HIGH, 1 MODERATE, 1 LOW) |
| 3 | BE | Env Vars | 27 env vars referenced in code but missing from .env (billing, webhook secrets, admin passwords) |
| 4 | BE | Env Vars | TEXTMAGIC_API_KEY and TEXTMAGIC_USERNAME in .env but never referenced in code (orphaned after MCP migration) |
| 5 | DT | Database | Missing index on campaignRecipients.campaignId (5 queries) |
| 6 | DT | Database | Missing index on schedulerLocks.lockName (6 queries) |
| 7 | DT | Database | Missing index on notifications.userId (3 queries) |
| 8 | BE | File Org | server/routes.ts (6200 lines) monolith still exists alongside decomposed routes/ |

## MINOR (15+ items)
- 10+ unused npm packages (framer-motion, next-themes, react-icons, etc.)
- 7 ghost entries in build allowlist (packages not installed)
- nanoid used but not in package.json (transitive dep)
- Test/dev packages in dependencies instead of devDependencies
- Page file naming inconsistency (PascalCase vs kebab-case)
- Legacy server/replit_integrations/batch/ directory
- No Vite chunk splitting
- No server source maps for production debugging
