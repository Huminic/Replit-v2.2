# Wave 3F-B — Operator Design-Gate Questions

**Drafted by orchestrator-as-advocate, 2026-05-07, post-Wave-3F-A close.**

These 6 items were INVESTIGATED in Wave 3F-A but require operator design / CX / product input to resolve. Each has an advocate-recommended option (marked ★), the tradeoffs, the estimated effort, and the files likely touched. Operator can answer each independently — no inter-dependencies — and the answers feed Wave 3F-B's OPENING bookend.

Live deploy is end-of-plan (Wave 11A), so 3F-B can ship at any pace without affecting customers.

---

## Item 1 — Conversion Rate `100%` on small denominators (TASTE / CX)

**Symptom:** When sold=6 / lost=0 (small sample), Conversion Rate honestly computes to 100%. Mathematically correct, visually misleading to a dealership manager who'd read it as "we're winning every deal" rather than "we have 6 closed deals and no losses recorded yet."

**Surface:** `client/src/pages/sales.tsx` Conversion Rate tile (`metric-value-sm-7`). Possibly also `/insights` Win Rate tile if the same shape applies (verify in implementation).

**Options (pick one):**

| | Option | UX | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Add "low confidence" badge when n < 20 (e.g. small "n=6" subscript or muted "limited data" tag below the value) | Real number stays visible; honest signal that sample is small | S (1-2 LOC + small style) | Adds visual element; needs a threshold pick |
| | B | Render `—` (em-dash) when n < 20; show real value at n ≥ 20 | Hides misleading 100%/0% spikes entirely | S (1-2 LOC) | Loses information; may confuse users who see a number one day and `—` the next |
| | C | Tooltip-only (value renders normally; tooltip on hover says "based on 6 deals") | Minimal visual change | S (3-5 LOC) | Most users won't hover; signal is hidden |
| | D | Leave as-is (operator chooses honesty over CX clarity) | No change | 0 | The misleading-100% concern persists |

**Advocate's recommendation:** ★ **A** — keeps the real number (operators can always read it), adds a small honest signal that sample is small. Threshold suggestion: n < 20 = "limited data" tag. If operator has a stronger preference for hiding small-sample percentages, B is the simpler fallback.

---

## Item 2 — `/sales/leads` 404 (PRODUCT)

**Finding:** Zero internal links target `/sales/leads`. The URL was hit during Wave 1C E2E manual exploration (likely a typo guess for `/sales`). The 404 is the correct behavior — there's no broken link.

**Options:**

| | Option | UX | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Leave as 404 | URL guesses fail; only Sales tab navigation works | 0 | None |
| | B | Add redirect `/sales/leads` → `/sales` | Typo-tolerant URL bar | XS (1 line in App.tsx) | Adds noise to the route table |
| | C | Build a separate `/sales/leads` drill-down page | New feature | M (new page + route + nav) | Out of v2.2 scope; would need product spec |

**Advocate's recommendation:** ★ **A** — there's no defect to fix; the 404 is correct. Operator only deviates if they want to add the redirect for typo tolerance.

---

## Item 3 — `/widget-landing` 404 (PRODUCT)

**Finding:** Only one reference exists — an ES-module import in `App.tsx:25` (`import WidgetLandingPage from "@/pages/widget-landing"`). The page IS routed, but at `/w/:slug` and `/p/:slug` — not at the literal `/widget-landing`. Hitting `/widget-landing` directly returns 404 (correct).

**Options:**

| | Option | UX | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Leave as 404 | URL guesses fail; documented widget URLs work | 0 | None |
| | B | Add redirect `/widget-landing` → some default landing | Typo-tolerant | XS | What target? Picking one is arbitrary without operator intent |
| | C | Rename `widget-landing.tsx` → `widget-page.tsx` (cosmetic) | None to user | XS | Just file rename; no behavior change |

**Advocate's recommendation:** ★ **A** — same as Item 2. No defect; the import name is internal-only.

---

## Item 4 — `/work-center` 404 risk in MobileNavDropdown (PRODUCT — bonus finding from S2)

**Finding:** `client/src/components/layout/MobileNavDropdown.tsx:55-60` references `/work-center?tab=*` URLs for menu items. There is NO `/work-center` route registered in `App.tsx`. On mobile, tapping these menu items would 404.

This is a REAL defect (live link to non-existent route), distinct from Items 2/3 above which were URL guesses.

**Options:**

| | Option | UX | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Add `/work-center` route in `App.tsx` (component to be picked — likely should map to `/my-work` or `/teambox` per intent) | Mobile menu works | XS (1 route line) + intent-decision | Need to know what page should render |
| | B | Update `MobileNavDropdown.tsx` to point at existing routes (`/my-work` or `/teambox` etc.) | Mobile menu works against existing routes | S (4 link updates + understand intent) | Easier IF `/work-center` is truly leftover-naming; harder if it's an intentional new top-level concept |
| | C | Remove the offending menu items from MobileNavDropdown | Mobile menu drops some items | S | Loss of nav functionality |
| | D | Build a `/work-center` page (new feature) | Net-new | L | Out of 3F scope |

**Advocate's recommendation:** ★ **B** — most likely the `/work-center` strings are stale references to what's now `/my-work` (the singular existing personal-work route) or `/teambox`. Operator confirms intent → builder updates the 4 link targets. If `/work-center` IS supposed to be a new top-level concept (Phase 3 TeamBox-related?), then this becomes a bigger conversation.

**Question for operator:** What was `/work-center` SUPPOSED to be? Old name for `/my-work`? Composite of `/my-work` + `/teambox`? A new tab?

---

## Item 5 — Source Quality Trends chart-render polish (DESIGN — carried from Wave 1C)

**Finding (from Wave 1C E2E):** The Source Quality Trends chart on `/insights` doesn't render cleanly in some states — surfaced as a vague "polish" item without specifics in the Wave 1C runtime matrix. Wave 3F-B should investigate, identify the actual visual defect(s), and pick a fix.

**Required upfront:** Operator confirms whether 3F-B should:

| | Option | Action | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Investigate first, then come back with a specific finding + options | Two-step gate (investigate, then decide) | XS (investigation) + ? (fix) | Slower but lower risk of misdirected fix |
| | B | Defer to a later wave (3F-C or post-launch polish) | None | 0 | Visual issue remains for v2.2 launch |
| | C | Skip — the chart looks fine to operator | None | 0 | Trust operator visual review |

**Advocate's recommendation:** ★ **A** — investigate-first is honest; "polish" is too vague to commit to a fix without a specific symptom. The investigation could be a 30-min subagent dispatch to capture exact rendering issues + propose options.

---

## Item 6 — Top Performing Agents — AI-only vs human-rep leaderboard (PRODUCT — carried from Wave 1C)

**Finding (from Wave 1C E2E):** The "Top Performing Agents" surface on `/insights` shows AI agents only. There's no human-rep leaderboard. Wave 1C surfaced this as "consider whether human reps should also appear here."

This is a PRODUCT decision — what does "Top Performing Agents" mean to a dealership manager?

**Options:**

| | Option | Behavior | Effort | Tradeoff |
|---|---|---|---|---|
| ★ A | Add a separate "Top Performing Reps" section alongside "Top Performing Agents" | Two leaderboards: AI agents and human reps | M (new component + data source) | Real value to dealership ops; new code |
| | B | Combine into one mixed leaderboard with a column indicating AI vs human | One table, mixed | M (component change + data merge) | Compares apples and oranges; AI volumes ≫ human; AI wins by default |
| | C | Rename the surface "Top Performing AI Agents" and add "Top Reps" elsewhere or defer | Clarifies current scope | S (rename + later add) | Dodges the real ask |
| | D | Leave as-is | No change | 0 | "Top Performing Agents" remains AI-only and silently ambiguous |

**Advocate's recommendation:** ★ **A** — a dealership manager wants to see both. Two-leaderboard pattern is clearer than B's mixed view (B always lets AI win because of volume).

**Question for operator:** Is human-rep leaderboard data available today? (If not, we'd need a data-source decision before this can ship.)

---

## How to answer

For each item, the operator can:
- Pick the ★ recommendation by saying "go with the recommendations" or item-by-item
- Pick a different lettered option per item
- Defer specific items to a future wave by saying "skip Item N for 3F-B"

Once operator picks, Wave 3F-B OPENING bookend is drafted with the picks locked in, scope markers prepared per item, and the wave executes the same bookend / 3-verifier-gate / merge-and-push pattern as 3F-A.

---

## Estimated 3F-B effort

If operator picks all ★ recommendations:
- Item 1 ★ A: S (1-2 LOC + small style)
- Item 2 ★ A: 0 (no action)
- Item 3 ★ A: 0 (no action)
- Item 4 ★ B: S (4 link updates after intent confirmation)
- Item 5 ★ A: investigation first, then ?
- Item 6 ★ A: M (new component + data source)

Total: roughly Item 1 + Item 4 + Item 5 (investigation) + Item 6 = one mid-sized wave. Items 2/3 add nothing.

If operator wants the smallest possible 3F-B (just the real defects): Items 1 + 4 only = S sub-wave (similar size to 3F-A).
