# T-021 Accessibility Audit — Violation Summary

**Timestamp:** 2026-03-26T23:30:00Z
**Pages scanned:** 8
**Scan tool:** axe-core 4.11.1 (WCAG 2.0 AA)

---

## Totals Across All 8 Pages (AC9)

| Severity | Unique Rules | Total Instances |
|----------|-------------|-----------------|
| Critical | 1 | 134 |
| Serious  | 2 | 137 |
| Moderate | 8 | 8 |
| Minor    | 0 | 0 |

**Total unique violation rules:** 11
**Total violation instances:** 279

---

## Critical Violations (1 rule, 134 instances)

### `button-name` — Ensure buttons have discernible text
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Impact:** Screen readers cannot identify button purpose
- **Pages affected:** All 8
- **Worst offender:** /service (99 instances)
- **Fix:** Add `aria-label`, `aria-labelledby`, or visible text to all `<button>` elements

---

## Serious Violations (2 rules, 137 instances)

### `color-contrast` — Foreground/background contrast below WCAG AA threshold
- **WCAG:** 1.4.3 Contrast (Minimum) (Level AA)
- **Impact:** Low-vision users cannot read text
- **Pages affected:** All 8
- **Worst offender:** /sales (39 instances)
- **Fix:** Increase contrast ratios to minimum 4.5:1 (normal text) or 3:1 (large text)

### `scrollable-region-focusable` — Scrollable regions not keyboard-accessible
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Impact:** Keyboard-only users cannot scroll content
- **Pages affected:** /sales only (1 instance)
- **Fix:** Add `tabindex="0"` or use focusable elements within scrollable containers

---

## Moderate Violations (consistent across pages)

Each page shows 1 moderate violation. These are typically related to form labels, landmark regions, or heading hierarchy. Not individually critical but should be addressed in accessibility remediation work.

---

## Severity Distribution by Page

| Page | Critical | Serious | Moderate | Minor | Total Instances |
|------|----------|---------|----------|-------|-----------------|
| / (AI Chat) | 1 (7) | 1 (10) | 1 | 0 | 18+ |
| /teambox | 1 (7) | 1 (28) | 1 | 0 | 36+ |
| /sales | 1 (5) | 2 (40) | 1 | 0 | 46+ |
| /service | 1 (99) | 1 (11) | 1 | 0 | 111+ |
| /marketing | 1 (5) | 1 (14) | 1 | 0 | 20+ |
| /management | 1 (5) | 1 (23) | 1 | 0 | 29+ |
| /settings/system | 1 (5) | 1 (10) | 1 | 0 | 16+ |
| /p/serra-honda | 1 (1) | 1 (1) | 1 | 0 | 3+ |

---

## Recommendations (Priority Order)

1. **button-name (Critical):** Audit all icon-only buttons app-wide. Add `aria-label` attributes. Service page has 99 unlabeled buttons — likely a table/list component rendering icon buttons per row.
2. **color-contrast (Serious):** Review color palette for AA compliance. Tool suggestion: use Chrome DevTools CSS Overview or a contrast checker against the design system.
3. **scrollable-region-focusable (Serious):** Single instance on /sales — add tabindex to the scrollable container.

---

## Verdict

The application has two systemic accessibility issues affecting all pages: unlabeled buttons and insufficient color contrast. These are common in early-stage SPAs and are fixable with focused remediation. No pages are fully WCAG AA compliant. The public landing page has the fewest violations.
