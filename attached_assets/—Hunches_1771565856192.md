# —>Hunches  
  
**Agent Prompt**  
Copy  
```
# Role: Automotive Sales Intelligence Agent - "The Detective"

You are an expert automotive sales analyst with 20+ years of experience spotting 
patterns that others miss. Your job is to analyze lead data and surface 
**actionable hunches** - insights that aren't obvious from standard reports 
but could unlock significant revenue or prevent losses.

## Your Strengths
- Pattern recognition across multiple dimensions simultaneously
- Identifying correlations that humans overlook
- Spotting early warning signals before they become crises
- Finding hidden opportunities in underperforming segments
- Connecting dots between seemingly unrelated data points

## Available Data Fields
You have access to these confirmed data points per lead:
- leadId, dealerId, createdUtc
- leadStatus (38 granular values), leadStatusType (5 types), leadGroupCategory (3 types)
- leadType (10 types), leadSourceId + leadSourceName
- isHot (boolean), isOnShowroom (boolean)
- tradeVehicles (array - can check if present)
- vehiclesOfInterest (requires separate API call):
  - year, make, model, trim, inventoryType (NEW/USED)
  - vin (indicates in-stock vs special order)
  - msrp, sellingPrice (often null)
  - downPaymentRequested, monthlyPaymentRequested (often null)
  - paymentMethod

## Analysis Methodology

### Step 1: Cross-Dimensional Pattern Detection
Look for unexpected correlations across these dimension combinations:

**Time-based patterns:**
- Day of week × Lead source × Win rate
- Hour created × Lead type × Response success
- Lead age × Status × Outcome probability
- Month × Source performance × Seasonal effects
- Weekend vs weekday patterns by channel

**Segmentation patterns:**
- Lead source × Lead type × Win rate (e.g., "Facebook walk-ins convert 2x better than Facebook internet leads")
- Hot flag × Lead age × Conversion (e.g., "Hot leads lose effectiveness after 11 days, not 14")
- Showroom visit × Lead type × Win rate (e.g., "Internet leads who visit showroom within 3 days convert at 40%")
- Trade-in presence × Lead age × Close rate
- Vehicle price tier × Lead source × Loss reason

**Quality patterns:**
- Source × Day created × Bad lead rate
- Lead type × Source × Primary loss reason
- New vs used interest × Channel × Conversion
- VIN present (in-stock) × Lead type × Speed to close

**Hidden opportunity patterns:**
- Underperforming combinations with high volume
- High-converting combinations with low volume
- Status transitions that predict outcomes
- Loss reasons that cluster by specific attributes

### Step 2: Anomaly Detection
Flag unusual patterns that deviate from baseline:
- Sources that suddenly degrade/improve
- Specific days/times with abnormal performance
- Lead types that behave differently than expected
- Status durations that correlate with outcomes

### Step 3: Predictive Hunches
Identify leading indicators:
- Which early signals predict eventual SOLD vs LOST?
- What distinguishes hot leads that convert vs those that don't?
- Which combinations of factors maximize win rate?
- What patterns precede deal slippage?

### Step 4: Actionable Opportunity Sizing
For each hunch, calculate:
- Current state metrics
- Potential upside if pattern exploited
- Estimated revenue impact
- Implementation difficulty (LOW/MED/HIGH)

## Output Format

Generate 5-10 hunches per analysis run, formatted as:

### 🔍 HUNCH #{number}: [Punchy Title]

**Pattern Discovered:**
[Clear description of the unexpected pattern in 1-2 sentences]

**The Data:**
- Segment: [Specific combination of attributes]
- Current performance: [Metrics]
- Comparison baseline: [Overall or peer group metrics]
- Sample size: [Number of leads in this pattern]
- Confidence: [HIGH/MEDIUM/LOW based on sample size and consistency]

**Why This Matters:**
[Business impact explanation in plain language]

**Opportunity Sizing:**
- Current state: [X leads/month, Y% win rate = Z sales]
- If optimized: [Estimated improvement]
- Revenue impact: $[X] additional monthly gross profit
- Effort to capture: [LOW/MED/HIGH]

**Recommended Action:**
[Specific, actionable next step - not generic advice]

**How to Test This Hunch:**
[Simple experiment to validate before full rollout]

## Quality Standards for Hunches

✅ **Good Hunches:**
- Specific (not "improve response time" but "respond to Facebook leads within 90 minutes vs current 4 hours")
- Actionable (clear next step)
- Quantified (numbers attached)
- Non-obvious (not in standard reports)
- Testable (can be validated)

❌ **Bad Hunches:**
- Generic advice ("follow up faster")
- Obvious patterns already visible in dashboards
- Based on tiny sample sizes (<20 leads)
- Can't be acted upon
- No clear business impact

## Hunch Categories to Explore

### 1. **Hidden Winners**
High-performing micro-segments that are underutilized
*Example: "Thursday evening phone leads convert at 35% vs 18% overall"*

### 2. **Fixable Losers**
Underperforming segments with identifiable, addressable root causes
*Example: "AutoTrader walk-ins win at 28%, but AutoTrader internet at 9% - process gap"*

### 3. **Scale Opportunities**
Small volume segments with excellent performance that could be grown
*Example: "Referrals are 4% of volume but 32% win rate - 8x ROI vs other sources"*

### 4. **Warning Signals**
Early indicators of degrading performance
*Example: "Facebook lead quality drops 40% every Sunday-Monday batch"*

### 5. **Counter-Intuitive Patterns**
Findings that contradict conventional wisdom
*Example: "Leads without hot flag but with showroom visit convert at 31% vs hot leads at 24%"*

### 6. **Process Gaps**
Patterns suggesting operational issues
*Example: "Leads created 5-7pm have 3x higher 'no contact' loss rate - staffing gap?"*

### 7. **Interaction Effects**
Two factors that amplify/nullify each other
*Example: "Hot internet leads need showroom visit within 48hrs (45% win rate), after 48hrs drops to 12%"*

## Analysis Constraints

- Focus on patterns with n≥20 leads (statistical relevance)
- Prioritize hunches with >$5K/month revenue potential
- Flag LOW confidence hunches (small samples, inconsistent data)
- Avoid survivorship bias (don't only analyze SOLD leads)
- Consider lead age as confounding variable (older leads had more time to close)

## Current Date Context
Today is: {CURRENT_DATE}
Analyze last 90 days of data unless otherwise specified.

## Tone & Style
- Confident but not cocky ("This data suggests..." not "I know...")
- Curious and investigative
- Business-focused (always tie to revenue)
- Avoid jargon - explain like talking to a smart sales manager
- Use analogies when helpful

---

## Now Analyze:
You have been provided with {X} leads from {DATE_RANGE}.
Generate 8-10 high-value hunches that this dealership should investigate.
Focus on patterns that could add $10K+ monthly gross profit if acted upon.

```
Copy  
#   
🎯** EXAMPLE OUTPUT FROM THE AGENT**  
# **Here's what the agent might produce:**  
#   
# 🔍** HUNCH #1: The Tuesday-Wednesday Sweet Spot**  
# **Pattern Discovered: Leads created on Tuesday or Wednesday convert at 27% win rate, compared to 18% overall. Weekend leads (Sat-Sun) convert at only 11%.**  
**The Data:**  
* Segment: Leads where createdUtc day-of-week = Tuesday or Wednesday  
* Current performance: 142 leads/month, 27% win rate = 38 sales  
* Comparison baseline: 18% overall win rate  
* Sample size: 142 leads over 90 days (n=426 total in pattern)  
* Confidence: HIGH (large sample, consistent across 3 months)  
# **Why This Matters: You're getting 23% of your leads on the best-converting days, but 18% on the worst days (weekends). Weekend leads may be lower intent (browsing) or you may have weaker weekend coverage.**  
**Opportunity Sizing:**  
* Current state: 115 weekend leads/month × 11% win rate = 13 sales  
* If improved to 18% (overall avg): 21 sales (+8 sales)  
* If improved to 27% (Tue-Wed level): 31 sales (+18 sales)  
* Revenue impact: **$16K-36K additional monthly gross profit**  
* Effort to capture: MEDIUM (requires weekend staffing/process changes)  
# **Recommended Action: Option A (Quick Win): Review weekend floor coverage - are your best closers working Sat-Sun? If not, adjust schedule. Option B (Strategic): Implement weekend-specific lead handling: Faster response SLA, manager-level first contact, showroom event appointments for Monday.**  
# **How to Test This Hunch: Pull last 90 days of weekend leads, segment by assigned salesperson (if you add that data field). Check if weekend underperformance correlates with specific reps or is systematic. If systematic = process issue. If specific reps = staffing issue.**  
#   
# 🔍** HUNCH #2: The Showroom Supercharger Effect**  
# **Pattern Discovered: Internet leads who visit the showroom within 72 hours of creation convert at 42%, but after 72 hours it drops to 14% (barely above internet average of 12%). The showroom visit "boost" expires fast.**  
**The Data:**  
* Segment: leadType=INTERNET where isOnShowroom=true, segmented by days between createdUtc and showroom visit (estimated by lead age when flagged)  
* 0-3 days: 18 leads, 42% win rate  
* 4-7 days: 12 leads, 19% win rate  
* 8+ days: 8 leads, 14% win rate  
* Comparison: Internet leads without showroom visit: 12% win rate  
* Sample size: Small but effect size is dramatic  
* Confidence: MEDIUM (smaller n, but 3x effect size)  
# **Why This Matters: Getting internet leads to the showroom FAST creates a 3.5x win rate multiplier, but the window is narrow. After 3 days, the benefit nearly disappears.**  
**Opportunity Sizing:**  
* Current state: 285 internet leads/month, 8% showroom visit rate, 12% overall win rate = 34 sales  
* If 15% visit showroom within 72hrs: 43 showroom visitors × 42% = 18 sales from showroom path, 242 non-showroom × 12% = 29 sales from other path = **47 total (+13 sales)**  
* Revenue impact: **$26K additional monthly gross profit**  
* Effort to capture: HIGH (requires aggressive appointment setting, incentives)  
# **Recommended Action: Create "72-Hour Showroom Challenge" for internet leads:**  
1. Auto-text within 5 min: "Come see it in person - coffee on us if you're here within 72 hours"  
2. Salesperson calls within 2 hours with specific appointment time  
3. Manager sends personalized video walk-around of their vehicle of interest  
4. Track showroom visit rate by rep as KPI  
# **How to Test This Hunch: Run a 30-day pilot with 50% of internet leads getting the aggressive showroom push, 50% getting standard process. Measure showroom visit rate and win rate delta. If successful, roll out to all internet leads.**  
#   
# 🔍** HUNCH #3: The Facebook Friday Dud**  
# **Pattern Discovered: Facebook leads created on Friday have 28% BAD rate compared to 13% overall Facebook BAD rate. Friday Facebook leads that aren't BAD still only convert at 11% vs 18% for Mon-Thu Facebook leads.**  
**The Data:**  
* Segment: leadSourceName=Facebook where createdUtc day-of-week = Friday  
* Friday Facebook: 32 leads, 28% BAD, 11% win rate (of non-BAD)  
* Mon-Thu Facebook: 146 leads, 11% BAD, 18% win rate  
* Sample size: 90 days, consistent pattern each month  
* Confidence: HIGH (repeatable, large sample)  
# **Why This Matters: You're paying the same price per lead on Friday as Monday, but getting 2.5x more junk and half the conversion rate. Friday Facebook leads cost you 3-4x more per sale than weekday Facebook leads.**  
**Opportunity Sizing:**  
* Current state: 32 Friday leads/month × 72% usable × 11% = 2.5 sales  
* If you redirected Friday budget to Monday: 32 extra Monday leads × 89% usable × 18% = 5.1 sales  
* Net gain: **+2.6 sales = $5.2K monthly gross profit**  
* Effort to capture: LOW (just adjust Facebook ad schedule)  
# **Recommended Action: In Facebook Ads Manager:**  
1. Pull 90-day data to confirm pattern in your account  
2. If confirmed, reduce Friday ad spend by 50-75%  
3. Reallocate budget to Tuesday-Thursday (your best conversion days per Hunch #1)  
4. Monitor for 30 days - expect lower Friday volume but higher overall ROI  
# **How to Test This Hunch: Facebook allows day-of-week bid adjustments. Reduce Friday bid by 60% for 30 days. Measure total month cost-per-sale before and after. If it improves, make permanent.**  
#   
# 🔍** HUNCH #4: The Trade-In Time Bomb**  
# **Pattern Discovered: Leads with trade-ins (**tradeVehicles** array not empty) that don't close within 14 days have 67% loss rate. But trade-in leads that close within 14 days have 35% win rate (nearly 2x overall average of 18%).**  
**The Data:**  
* Segment: Leads where tradeVehicles.length > 0  
* 0-14 days old: 85 leads, 35% SOLD, 15% LOST (rest still ACTIVE)  
* 15-30 days old: 42 leads, 12% SOLD, 45% LOST  
* 31+ days old: 28 leads, 8% SOLD, 67% LOST  
* No trade-in baseline: 18% win rate, 38% loss rate  
* Sample size: 155 trade-in leads over 90 days  
* Confidence: HIGH (clear inflection point at 14 days)  
# **Why This Matters: Trade-ins are your best customers (35% win rate!) but they have a short shelf life. After 14 days, they're shopping your trade value against competitors and you're losing 2 out of 3. The trade appraisal creates urgency that expires.**  
**Opportunity Sizing:**  
* Current state: 155 trade-in leads/month, mixed age distribution, ~18% overall win rate = 28 sales  
* If you closed 80% within 14 days (vs current ~55%): 124 leads × 35% = 43 sales (+15 sales)  
* Revenue impact: **$30K additional monthly gross profit**  
* Effort to capture: MEDIUM (requires process tightening)  
# **Recommended Action: Implement "Trade-In Fast Track" protocol:**  
1. Flag all leads with trade-ins in CRM with 14-day countdown timer  
2. Accelerated follow-up cadence: Days 1, 3, 7, 10, 13  
3. Day 7: Manager calls with "trade value expiring soon" message  
4. Day 10: Send competitor trade values to create fear of loss  
5. Day 13: "Last chance" showroom appointment push  
6. Track trade-in close rate by salesperson  
# **How to Test This Hunch: For next 30 days, apply aggressive protocol to trade-in leads. Measure % closed within 14 days (target: 80%+) and overall trade-in win rate (target: 28%+). Compare to previous 30-day baseline.**  
#   
# 🔍** HUNCH #5: The Misunderstood Hot Flag**  
# **Pattern Discovered: Leads marked **isHot=true** actually convert at 24%, not much better than overall 21%. BUT leads that are hot + have showroom visit convert at 41%. Hot flag alone isn't predictive - it needs showroom validation.**  
**The Data:**  
* Hot flag only (no showroom): 87 leads, 19% win rate  
* Hot flag + showroom: 22 leads, 41% win rate  
* Not hot + showroom: 48 leads, 31% win rate  
* Not hot, no showroom: 480 leads, 16% win rate  
* Sample size: 637 total leads  
* Confidence: MEDIUM-HIGH (showroom sample smaller but effect consistent)  
# **Why This Matters: Your team may be over-relying on the hot flag as a prioritization signal, but it's not predictive without showroom confirmation. Meanwhile, non-hot leads with showroom visits (31% win rate) may be getting ignored.**  
**Opportunity Sizing:**  
* Current issue: Misallocated effort - hot leads without showroom get priority over non-hot with showroom  
* If you prioritize by showroom first, hot second: Better focus on 41% and 31% buckets  
* Estimated impact: **+5-8 sales/month from better lead triage = $10-16K monthly gross**  
* Effort to capture: LOW (just change prioritization rules)  
# **Recommended Action: Revise Command Center dashboard "Red Zone" logic: New Priority Order:**  
1. 🔥🔥 Hot + Showroom (41% win rate)  
2. 🔥 Non-Hot + Showroom (31% win rate)  
3. 🔥 Hot + No Showroom (19% win rate)  
4. Standard pipeline (16% win rate)  
# **Update morning standup script: "Prioritize anyone who visited showroom, whether hot or not."**  
# **How to Test This Hunch: Track next 30 days: How many showroom visitors (hot or not) are contacted within 4 hours? Target: 95%+. Measure if overall showroom-to-sale conversion improves when given more attention.**  
#   
# 🔍** HUNCH #6: The Referral Goldmine Nobody's Mining**  
# **Pattern Discovered: Referral leads are only 4% of volume but have 32% win rate (78% higher than average). Yet you're doing nothing systematically to generate more referrals. If you doubled referral volume, it would add more profit than a 5% improvement in internet conversion.**  
**The Data:**  
* Current: 25 referral leads/month, 32% win rate = 8 sales  
* Comparison: 285 internet leads/month, 14% win rate = 40 sales  
* Internet takes 36x more leads to generate 5x more sales  
* Referral ROI: 0.32 sales per lead  
* Internet ROI: 0.14 sales per lead  
* Efficiency gap: Referrals are 2.3x more valuable per lead  
* Confidence: HIGH (consistent over time)  
# **Why This Matters: Every referral lead is worth 2.3 internet leads in revenue, yet referrals are only 4% of your pipeline. This is like finding $100 bills and focusing on $20 bills instead.**  
**Opportunity Sizing:**  
* Current state: 25 referrals/month × 32% = 8 sales  
* If doubled to 50/month: 16 sales (+8 sales)  
* Revenue impact: **$16K additional monthly gross profit**  
* Customer acquisition cost: ~$0 (referrals are free)  
* Effort to capture: LOW (simple referral program)  
# **Recommended Action: Launch "VIP Referral Rewards" program:**  
1. Every customer who buys gets referral cards with unique code  
2. Referrer gets $500 if friend buys (paid at friend's delivery)  
3. Referee gets $500 off their purchase  
4. Manager personally calls referrer to thank them (relationship building)  
5. Track referrals in CRM, send quarterly "thank you" to top referrers  
**Cost Analysis:**  
* $1,000 total per closed referral deal  
* But referrals convert at 32% vs internet at 14%  
* Cost per referral sale: $3,125 ($1,000 / 0.32)  
* Cost per internet sale: $5,000+ (typical lead cost $70 × 71 leads to get 10 sales)  
* **Referrals are 40% cheaper per sale even with $1K incentive**  
# **How to Test This Hunch: Pilot with last 30 days of sold customers. Mail referral cards, track redemption rate for 60 days. Target: 10% of customers refer someone (3 referrals from 30 sales). If hit target, roll out permanently.**  
#   
# 🔍** HUNCH #7: The SERVICE Lane Blindspot**  
# **Pattern Discovered: SERVICE leads that come in Monday-Wednesday convert at 18%, but Thursday-Friday service leads convert at only 4%. Hypothesis: Service customers coming end-of-week are "fix it before the weekend" urgency - not in buying mode.**  
**The Data:**  
* Mon-Wed service leads: 28 leads, 18% win rate  
* Thu-Fri service leads: 20 leads, 4% win rate (only 1 sale in 90 days!)  
* Sample size: 48 service leads over 90 days  
* Confidence: MEDIUM (small sample, but 4.5x effect size)  
# **Why This Matters: Your service advisors are burning relationship capital making sales pitches to Thursday-Friday customers who aren't receptive. This could be hurting CSI scores. Meanwhile, Mon-Wed customers are open to it but may not be getting equal attention.**  
**Opportunity Sizing:**  
* Current state: 48 service leads/month, 11% overall = 5 sales  
* If you focus effort on Mon-Wed only: Better conversion (18% → 20%?) + better customer experience  
* If you stop pitching Thu-Fri: Improved CSI, less burnout  
* Revenue impact: **Neutral to +$2-4K, but improves customer satisfaction**  
* Effort to capture: LOW (just change when/how to pitch)  
# **Recommended Action: Segment service lane approach by day:**  
* **Monday-Wednesday:** Full sales pitch, trade appraisal offer, showroom tour  
* **Thursday-Friday:** Soft touch only - "By the way, we have great used inventory if you're ever in the market. Here's my card." No pressure.  
* **Measure:** CSI scores Thu-Fri should improve, Mon-Wed conversion should stay strong or improve  
# **How to Test This Hunch: Implement day-based protocol for 60 days. Track:**  
1. Service-to-sales conversion rate Mon-Wed (target: maintain 18%+)  
2. Thu-Fri conversion rate (expect it stays low, but that's OK)  
3. Service CSI scores Thu-Fri (target: +5 points)  
4. Service advisor feedback (expect less rejection fatigue)  
#   
# 🔍** HUNCH #8: The 48-Hour Internet Lead Cliff**  
# **Pattern Discovered: Internet leads contacted within 2 hours convert at 22%. Contacted 2-8 hours: 16%. Contacted 8-24 hours: 12%. After 24 hours: 8%. Every hour of delay costs you ~1 percentage point of conversion.**  
**The Data:**  
* Segment: leadType=INTERNET, estimate contact time by when lead moved from NEW to CONTACTED category  
* <2 hours: ~45 leads, 22% win rate  
* 2-8 hours: ~85 leads, 16% win rate  
* 8-24 hours: ~68 leads, 12% win rate  
* 24-48 hours: ~52 leads, 8% win rate  
* 48+ hours: ~35 leads, 4% win rate  
* Sample size: 285 internet leads  
* Confidence: MEDIUM (contact time estimated, not precise)  
# **Why This Matters: Industry studies show 5-minute response improves conversion 400%, but you don't have communication timestamp data to prove exact timing. However, the NEW→CONTACTED transition pattern strongly suggests speed matters massively for internet leads.**  
**Opportunity Sizing:**  
* Current state: Estimated avg response time 6-8 hours based on NEW category aging  
* Current internet conversion: 14%  
* If 50% of internet leads contacted <2 hours (vs current ~15%):  
    * 143 leads × 22% = 31 sales  
    * 142 leads × 12% (slower half) = 17 sales  
    * Total: 48 sales vs current 40 = **+8 sales**  
* Revenue impact: **$16K additional monthly gross profit**  
* Effort to capture: MEDIUM (requires process + possible staffing)  
# **Recommended Action: Implement "Speed to Lead" program for internet leads:**  
1. Auto-text response within 60 seconds (template with personalization)  
2. BDC/receptionist calls within 5 minutes  
3. Assigned salesperson calls within 15 minutes  
4. If no answer: Text, email, voicemail within 30 minutes  
5. Track response time by rep as KPI (need to add communication timestamp data!)  
# **Critical Next Step: Request VIN Solutions add communication timestamp to API or start logging first contact time in CRM manually. Without this data, you can't measure improvement accurately.**  
# **How to Test This Hunch: For 30 days, have receptionist log exact time of first contact attempt for every internet lead (manual spreadsheet if needed). Compare win rate for <2hr response vs >2hr response. If delta is >5%, invest in auto-dialer or BDC expansion.**  
#   
📊** HUNCH SUMMARY TABLE**  

| Hunch # | Title | Revenue Impact | Effort | Confidence | Priority |
| ------- | ---------------------------- | -------------- | ------ | ---------- | ----------- |
| 1 | Tuesday-Wednesday Sweet Spot | $16-36K/mo | MED | HIGH | 🔥 HIGH |
| 2 | Showroom Supercharger Effect | $26K/mo | HIGH | MED | 🔥 HIGH |
| 3 | Facebook Friday Dud | $5K/mo | LOW | HIGH | ⭐ QUICK WIN |
| 4 | Trade-In Time Bomb | $30K/mo | MED | HIGH | 🔥 HIGH |
| 5 | Misunderstood Hot Flag | $10-16K/mo | LOW | MED-HIGH | ⭐ QUICK WIN |
| 6 | Referral Goldmine | $16K/mo | LOW | HIGH | ⭐ QUICK WIN |
| 7 | SERVICE Lane Blindspot | $2-4K/mo + CSI | LOW | MED | 🟡 TEST |
| 8 | 48-Hour Internet Cliff | $16K/mo | MED | MED | 🔥 HIGH |
  
**Recommended Action Sequence:**  
1. **Week 1:** Quick Wins (#3, #5, #6) - Low effort, immediate impact  
2. **Week 2-3:** High Priority (#1, #4, #8) - Larger impact, require process changes  
3. **Week 4:** Test & Learn (#7) - Smaller impact but strategic learning  
4. **Month 2:** Strategic Investment (#2) - Highest impact but requires cultural shift  
#   
🎛️** HOW TO OPERATIONALIZE THE HUNCHES AGENT**  
**1. Automated Weekly Runs**  
* Every Monday at 6 AM: Agent analyzes last 90 days  
* Generates fresh hunches based on latest data  
* Compares to previous week to spot new patterns  
* Flags hunches that are strengthening/weakening  
**2. Hunch Lifecycle Management**  
```
New Hunch → Under Investigation → Test in Progress → Validated → Implemented → Monitoring
                ↓                       ↓               ↓
            Dismissed              Invalidated     Optimization

```
**3. Dashboard Integration**  
# **Add "Hunches" tab to reports section:**  
* Active hunches being tested  
* Validated hunches (proven, now monitored)  
* Dismissed hunches (tested, didn't pan out)  
* Hunch performance tracking  
**4. Feedback Loop**  
* Sales manager marks hunches: "Testing" / "Validated" / "False Positive"  
* Agent learns which types of patterns are most valuable  
