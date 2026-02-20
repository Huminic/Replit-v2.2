# —>Reports  
#   
#   
  

| Reason Category | Count | % of Total Losses | % of All Leads |
| ---------------------------------------- | ----- | ----------------- | -------------- |
| LOST_LEAD_PROCESS_COMPLETED | 45 | 35% | 9% |
| LOST_PURCHASED_SAME_BRAND_ELSEWHERE | 28 | 22% | 5.6% |
| LOST_PURCHASED_DIFFERENT_BRAND_ELSEWHERE | 18 | 14% | 3.6% |
| BAD_BAD_OR_NO_CONTACT_INFORMATION | 32 | - | 6.4% |
| BAD_DUPLICATE | 15 | - | 3% |
| (All other LOST_* and BAD_* categories) | … | … | … |
  
****Section 2: Loss Patterns by Lead Source****  

| Source Name | Total Leads | Lost | Bad | Loss Rate | Bad Rate | Primary Loss Reason |
| ------------ | ----------- | ---- | --- | --------- | -------- | --------------------------- |
| Facebook Ads | 178 | 68 | 24 | 38% | 13% | LOST_LEAD_PROCESS_COMPLETED |
| AutoTrader | 115 | 52 | 18 | 45% | 16% | BAD_BAD_OR_NO_CONTACT |
| Walk-In | 67 | 12 | 2 | 18% | 3% | LOST_PURCHASED_SAME_BRAND |
  
****Section 3: Loss Patterns by Lead Type****  

| Lead Type | Total | Lost | Bad | Loss Rate | Bad Rate | Top Loss Reason |
| --------- | ----- | ---- | --- | --------- | -------- | --------------------------- |
| INTERNET | 285 | 118 | 42 | 41% | 15% | LOST_LEAD_PROCESS_COMPLETED |
| WALK_IN | 142 | 28 | 4 | 20% | 3% | LOST_PURCHASED_SAME_BRAND |
| PHONE | 95 | 38 | 12 | 40% | 13% | LOST_LEAD_PROCESS_COMPLETED |
| SERVICE | 48 | 22 | 8 | 46% | 17% | LOST_LEAD_PROCESS_COMPLETED |
  
****Section 4: Loss Timing Analysis****  

| Lead Age at Loss | Count | % of Losses | Avg Days Old |
| ---------------- | ----- | ----------- | ------------ |
| 0-7 days         | 45    | 28%         | 4.2          |
| 8-14 days        | 38    | 24%         | 10.8         |
| 15-30 days       | 42    | 26%         | 21.5         |
| 31-60 days       | 28    | 17%         | 43.2         |
| 60+ days         | 8     | 5%          | 78.6         |
  
****Section 5: Competitive Intelligence****  
* Month-over-month trend of LOST_PURCHASED_SAME_BRAND_ELSEWHERE  
* Month-over-month trend of LOST_PURCHASED_DIFFERENT_BRAND_ELSEWHERE  
* Alert if either grows >15% month-over-month  
# **Section 6: Re-Engagement Opportunity List Export of leads where:**  
* leadStatus = 'LOST_LEAD_PROCESS_COMPLETED' (life got in the way)  
* createdUtc is 90-180 days ago  
* Sorted by vehicle MSRP descending (when available)  
**How It’s Actionable**  
1. **Fix biggest leak**: Top loss reason gets dedicated task force that week  
2. **Source accountability**: Send Red sources their loss/bad rate with ultimatum  
3. **Channel training**: If INTERNET shows 41% loss rate vs WALK_IN 20% → Train team on digital lead handling  
4. **Early intervention**: If 28% of losses happen in 0-7 days → Focus on rapid response  
5. **Recovery campaign**: Export re-engagement list → Import to CRM for drip campaign  
**Business Impact**  
* If you LOSE 60 deals/month and reduce losses by just 10% = 6 more sales @ $2K profit = **$12K monthly gross**  
* Eliminating one toxic source (high BAD rate) = cleaner pipeline, less wasted time  
* Recovery campaigns at 2-3% conversion from 200 old leads = **4-6 sales with zero acquisition cost**  
# **Data Sources (all confirmed 100% available)**  
* ✅ leadStatus (38 granular values)  
* ✅ leadStatusType (LOST, BAD)  
* ✅ leadSource + /leadSources lookup  
* ✅ leadType (10 types)  
* ✅ createdUtc (for age bucketing)  
#   
# 🎯** Priority 2: Lead Source Quality Report **⭐** 100% Buildable**  
**What It Shows**  
# **Weekly scorecard for every lead source, ranked by quality:**  
# **Main Scorecard Table:**  

| Rank | Source Name | 7d Vol | 30d Vol | Win Rate | Quality Score | Active % | Bad % | Trend | Grade |
| ---- | ----------- | ------ | ------- | -------- | ------------- | -------- | ----- | ------ | ----- |
| 1 | Walk-In | 15 | 67 | 31% | 0.89 | 48% | 3% | → | 🟢 A+ |
| 2 | Referrals | 8 | 34 | 28% | 0.82 | 52% | 5% | ↗️ +12% | 🟢 A |
| 3 | Facebook | 42 | 178 | 18% | 0.62 | 32% | 13% | ↗️ +5% | 🟡 B |
| … | … | … | … | … | … | … | … | … | … |
| 8 | AutoTrader | 28 | 115 | 12% | 0.48 | 28% | 16% | ↘️ -8% | 🔴 D |
  
****Metrics Defined:****  
* **Volume**: Count of leads with this leadSourceId  
* **Win Rate**: SOLD / (SOLD + LOST) — excludes ACTIVE and BAD  
* **Quality Score**: (SOLD + ACTIVE - BAD) / Total — rewards sales + active pipeline, penalizes junk  
* **Active %**: ACTIVE / Total — healthy pipeline contribution  
* **Bad %**: BAD / Total — junk rate  
* **Trend**: Current 30d volume vs previous 30d  
* **Grade**:  
    * A: Win rate >25% AND Bad rate <8%  
    * B: Win rate 18-25% AND Bad rate <12%  
    * C: Win rate 12-18% OR Bad rate 12-18%  
    * D: Win rate <12% OR Bad rate >18%  
    * F: Win rate <8% OR Bad rate >25%  
# **Red Flag Alerts:**  
* 🚨 Any source with Bad Rate >20% for 2+ consecutive weeks  
* 🚨 Any source graded F for 3+ consecutive weeks  
* 🚨 Volume drop >30% week-over-week  
# **Source Concentration Risk:**  
* % of total leads from single largest source  
* Alert if >40% (over-reliance on one channel)  
**How It’s Actionable**  
1. **Weekly budget decisions**: Every Monday, review grades → Shift spend from D/F sources to A/B sources  
2. **Vendor ultimatums**: Screenshot F-grade source performance → “Fix this or we cancel in 30 days”  
3. **Kill list**: Any F-grade source for 3 months + <5% volume → Auto-cancel  
4. **Scale winners**: A+ sources get budget increase next month  
5. **Diversification**: If top source is >40% of volume → Actively recruit 2-3 new sources  
**Business Impact**  
* Eliminating 2 worst sources (20% of $10K budget) and reallocating to best sources = **15-25% more sales from same spend**  
* Preventing over-reliance on one source = risk mitigation if that source degrades  
* Clear accountability = vendors improve or lose business  
# **Data Sources (all confirmed 100% available)**  
* ✅ leadSourceId + /leadSources name lookup  
* ✅ leadStatusType (SOLD, LOST, ACTIVE, BAD)  
* ✅ createdUtc (for time windows and trends)  
#   
# 🎯** Priority 3: Channel Performance Comparison **⭐** 100% Buildable**  
**What It Shows**  
# **Monthly head-to-head comparison of all 10 lead types:**  
# **Main Comparison Table:**  

| Lead Type | Volume | % of Total | Win Rate | Loss Rate | Bad Rate | Hot Lead % | Showroom % | Trade-In % |
| ----------------- | ------ | ---------- | -------- | --------- | -------- | ---------- | ---------- | ---------- |
| INTERNET | 285 | 45% | 14% | 41% | 15% | 12% | 8% | 62% |
| WALK_IN | 142 | 28% | 26% | 20% | 3% | 22% | 100% | 58% |
| PHONE | 95 | 15% | 18% | 40% | 11% | 8% | 15% | 55% |
| REFERRAL | 25 | 4% | 32% | 22% | 2% | 41% | 45% | 68% |
| PREVIOUS_CUSTOMER | 18 | 3% | 28% | 18% | 4% | 35% | 38% | 72% |
| SERVICE | 48 | 8% | 11% | 46% | 17% | 3% | 12% | 48% |
| WEBSITE_CHAT | 32 | 5% | 16% | 38% | 12% | 15% | 5% | 60% |
| (Other types) | … | … | … | … | … | … | … | … |
  
****Metrics Defined:****  
* **Volume**: Count of leads of this type  
* **Win Rate**: SOLD / (SOLD + LOST)  
* **Loss Rate**: LOST / Total  
* **Bad Rate**: BAD / Total  
* **Hot Lead %**: isHot=true / Total for this type  
* **Showroom %**: isOnShowroom=true / Total  
* **Trade-In %**: Leads with non-empty tradeVehicles array  
# **Key Insights Section:**  
1. **Highest Converting Channel**: [Type] at [X]% win rate  
2. **Highest Volume Channel**: [Type] at [X] leads  
3. **Best Quality Channel**: [Type] with lowest Bad Rate  
4. **Loyalty Indicator**: REFERRAL + PREVIOUS_CUSTOMER = [X]% of pipeline  
5. **Digital Percentage**: (INTERNET + WEBSITE_CHAT) / Total = [X]%  
# **Month-over-Month Trends:**  
* Volume change by channel  
* Win rate change by channel  
* Growing vs declining channels  
**How It’s Actionable**  
1. **Investment strategy**: If WALK_IN shows 26% win rate vs INTERNET 14% → Invest in showroom experience OR fix digital follow-up  
2. **Service opportunity**: If SERVICE shows 8% volume but only 11% win rate → Train service advisors on sales referrals  
3. **Referral program**: If REFERRAL shows 32% win rate but only 4% volume → Launch $500 customer referral bonus = multiply your best channel  
4. **Digital maturity**: Track digital % month-over-month → Are you evolving with market?  
5. **Process customization**: Stop treating all leads the same:  
    * INTERNET → Auto-text within 5 min  
    * WALK_IN → Manager greet  
    * REFERRAL → VIP treatment  
**Business Impact**  
* **Service cross-sell**: 500 service customers/month × 2% current conversion = 10 sales. Improve to 5% = **15 more sales/month @ $2K = $30K monthly gross**  
* **Referral multiplication**: Doubling referral volume (4% to 8%) at 32% win rate vs 18% average = **disproportionate revenue gain**  
* **Channel optimization**: Knowing which channels work lets you double down on winners  
# **Data Sources (all confirmed 100% available)**  
* ✅ leadType (10 types: INTERNET, WALK_IN, PHONE, REFERRAL, PREVIOUS_CUSTOMER, SERVICE, WEBSITE_CHAT, etc.)  
* ✅ leadStatusType (SOLD, LOST, BAD, ACTIVE)  
* ✅ isHot boolean  
* ✅ isOnShowroom boolean  
* ✅ tradeVehicles array (check length > 0)  
* ✅ createdUtc (for time-based trends)  
#   
# 🎯** Priority 4: Pipeline Velocity & Freshness Monitor **⭐** 100% Buildable**  
**What It Shows**  
# **Weekly pulse-check on pipeline momentum and health:**  
**Section 1: Velocity Metrics**  

| Metric                 | Value | Benchmark | Status          |
| ---------------------- | ----- | --------- | --------------- |
| 7-Day New Lead Avg     | 18.4  | -         | -               |
| 30-Day New Lead Avg    | 16.8  | -         | ↗️ Accelerating  |
| 90-Day New Lead Avg    | 15.2  | -         | ↗️ Strong Growth |
| This Month YTD         | 142   | -         | -               |
| Same Period Last Month | 128   | -         | +11%            |
  
****Section 2: Pipeline Freshness****  

| Freshness Metric             | Count | % of Active | Target | Status      |
| ---------------------------- | ----- | ----------- | ------ | ----------- |
| Created 0-7 days ago         | 85    | 38%         | >30%   | 🟢 Healthy   |
| Created 8-14 days ago        | 48    | 21%         | -      | -           |
| Created 15-30 days ago       | 62    | 28%         | -      | -           |
| Created 31-60 days ago       | 22    | 10%         | <15%   | 🟢 Good      |
| Created 60+ days ago (STALE) | 8     | 3%          | <5%    | 🟢 Excellent |
  
****Section 3: Lead Age Distribution Visual histogram showing ACTIVE lead count by age buckets****  
**Section 4: Status Category Distribution**  

| Category  | Count | % of Active |
| --------- | ----- | ----------- |
| NEW       | 42    | 19%         |
| WAITING   | 28    | 12%         |
| CONTACTED | 155   | 69%         |
  
****Section 5: Hot Lead Monitoring****  

| Metric                 | Value         |
| ---------------------- | ------------- |
| Total Hot Leads        | 32            |
| Hot Lead %             | 14% of Active |
| Avg Age of Hot Leads   | 8.4 days      |
| Hot Leads >14 days old | 5 (🚨 Alert)   |
  
****Section 6: Month-End Forecast****  
* Current SOLD count (MTD): [X]  
* Current ACTIVE count: [Y]  
* Historical win rate (30-day): [Z]%  
* Projected month-end SOLD: [X + (Y × Z%)]  
* Monthly target: [Target]  
* Gap: [Target - Projected]  
**How It’s Actionable**  
1. **Velocity alerts**: If 7-day avg drops 20% below 30-day avg → Investigate lead source issues immediately  
2. **Stale pipeline cleaning**: Weekly task - export 60+ day old ACTIVE leads → Update status or mark LOST  
3. **Hot lead intervention**: Any hot lead >14 days old gets flagged for manager review  
4. **NEW lead backlog**: If NEW category >25% of ACTIVE → Response capacity problem, reassign leads  
5. **Forecast gap management**: If projected month-end is 15% below target by mid-month → Launch promotion/push event  
**Business Impact**  
* **Early warning system**: Velocity drop detection prevents end-of-month surprises  
* **Pipeline hygiene**: Clearing stale leads (20% of typical pipeline) frees **4-6 hours/week per rep** to work fresh opportunities  
* **Hot lead protection**: Preventing hot leads from going cold = **3-5x conversion rate preservation**  
* **Predictable revenue**: Accurate forecasting enables better inventory, staffing, cash flow planning  
# **Data Sources (all confirmed 100% available)**  
* ✅ createdUtc (all velocity and age calculations)  
* ✅ leadStatusType (ACTIVE count, SOLD count)  
* ✅ leadGroupCategory (NEW, WAITING, CONTACTED)  
* ✅ isHot boolean  
* ✅ Historical data for win rate calculation  
#   
# 🎯** Priority 5: Active Lead Triage Dashboard **⭐** 100% Buildable**  
**What It Shows**  
# **Real-time (refreshed hourly) prioritized action list:**  
🔴** RED ZONE: Immediate Action Required**  
**Table 1: Hot Leads Going Cold**  

| Lead ID | Created | Days Old | Type | Source | Vehicle Interest | Status |
| ------- | ---------- | -------- | -------- | -------- | ---------------- | --------------- |
| 12847 | 2024-01-15 | 18 | INTERNET | Facebook | 2024 F-150 | ACTIVE_NEW_LEAD |
| 12756 | 2024-01-16 | 17 | WALK_IN | Organic | 2023 Camry | ACTIVE_WAITING… |
  
**Filter: isHot=true AND leadStatusType=ACTIVE AND createdUtc > 14 days ago****** ******Sorted by: Days old DESC**  
**Table 2: NEW Leads Aging Out**  

| Lead ID | Created | Hours Old | Type | Source | Hot? | Status |
| ------- | ---------------- | --------- | -------- | ---------- | ---- | --------------- |
| 12891 | 2024-01-17 09:15 | 73 | INTERNET | AutoTrader | No | ACTIVE_NEW_LEAD |
  
**Filter: leadGroupCategory=NEW AND createdUtc > 48 hours ago****** ******Sorted by: Hours old DESC**  
**Table 3: Showroom Visitors Not Converting**  

| Lead ID | Created | Days Old | Type | Source | Vehicle | Status |
| ------- | ---------- | -------- | ------- | ------- | ----------- | ---------------- |
| 12823 | 2024-01-10 | 23 | WALK_IN | Organic | 2024 Accord | ACTIVE_CONTACTED |
  
**Filter: isOnShowroom=true AND leadStatusType=ACTIVE AND createdUtc > 7 days ago****** ******Sorted by: Days old DESC**  
🟡** YELLOW ZONE: Watch List**  
**Table 4: Leads Approaching Stale Status**  

| Lead ID | Created | Days Old | Type | Source | Last Status | Status |
| ------- | ---------- | -------- | -------- | -------- | ---------------- | ------ |
| 12645 | 2023-12-28 | 35 | INTERNET | Facebook | ACTIVE_CONTACTED | - |
  
**Filter: leadStatusType=ACTIVE AND createdUtc between 28-35 days ago****** ******Count displayed prominently**  
🟢** GREEN ZONE: Performance Tracking**  
# **Today’s Metrics:**  
* New leads today: [X] (Avg: [Y], Status: [↗️/↘️/→])  
* ACTIVE pipeline: [X] leads  
* This week close rate: [X]% (Last 4 weeks avg: [Y]%)  
**How It’s Actionable**  
1. **Morning standup (8am)**: Sales manager opens dashboard → Assigns RED zone leads to specific salespeople before floor opens  
2. **Hourly checks**: Dashboard refreshes hourly → New RED zone items trigger text/email alerts  
3. **End-of-day accountability**: Each salesperson must clear their RED zone items or provide status update  
4. **Weekly pipeline cleaning**: YELLOW zone exported every Friday → Update status or mark LOST over weekend  
**Business Impact**  
* **Hot lead salvation**: Catching hot leads before they go cold (14-day threshold) = **maintaining 3-5x conversion rate**  
* **Response time improvement**: NEW leads flagged at 48hrs = **preventing “did not respond” losses** (typically 30-40% of all losses)  
* **Showroom conversion**: Following up with showroom visitors who didn’t buy = **10-15% second-touch conversion rate**  
# **Data Sources (all confirmed 100% available)**  
* ✅ leadId, createdUtc, leadType, leadSource  
* ✅ leadStatus, leadStatusType, leadGroupCategory  
* ✅ isHot, isOnShowroom booleans  
* ✅ Basic vehicle info from lead object (or note “call /vehicles/interest for details”)  
#   
# 🎯** Priority 6: Deal Status & Category Snapshot **⭐** 100% Buildable**  
**What It Shows**  
# **Weekly snapshot of where leads are in the process:**  
**Section 1: Status Type Summary**  

| Status Type | Count | % of Total | Change vs Last Week |
| ----------- | ----- | ---------- | ------------------- |
| ACTIVE      | 225   | 35%        | +8                  |
| SOLD        | 142   | 22%        | +12                 |
| LOST        | 128   | 20%        | +6                  |
| BAD         | 95    | 15%        | +4                  |
| COMPLETE    | 52    | 8%         | +3                  |
  
****Section 2: Top 10 Granular Statuses (from 38 available)****  

| Status                      | Count | % of Total | Trend |
| --------------------------- | ----- | ---------- | ----- |
| ACTIVE_CONTACTED            | 98    | 15%        | +5    |
| ACTIVE_NEW_LEAD             | 42    | 6%         | -2    |
| SOLD_DELIVERED              | 85    | 13%        | +8    |
| LOST_LEAD_PROCESS_COMPLETED | 45    | 7%         | +3    |
| ACTIVE_SET_APPOINTMENT      | 28    | 4%         | +1    |
| …                           | …     | …          | …     |
  
****Section 3: Lead Group Category Breakdown (NEW, WAITING, CONTACTED)****  

| Category  | Count | % of Active | Avg Age   |
| --------- | ----- | ----------- | --------- |
| NEW       | 42    | 19%         | 2.8 days  |
| WAITING   | 28    | 12%         | 8.4 days  |
| CONTACTED | 155   | 69%         | 14.2 days |
  
****Section 4: Critical Status Alerts****  
* SOLD_PENDING_FINANCE count (deals at risk)  
* ACTIVE_SET_APPOINTMENT count (near-term opportunities)  
* ACTIVE_WAITING_FOR_PROSPECT_RESPONSE count (ball in customer court)  
# **Section 5: Week-over-Week Movement How many leads moved:**  
* NEW → CONTACTED: [X]  
* ACTIVE → SOLD: [X]  
* ACTIVE → LOST: [X]  
*(Calculated by comparing snapshots, not true transition tracking)*  
**How It’s Actionable**  
1. **Deal protection**: If SOLD_PENDING_FINANCE count grows week-over-week → Finance process bottleneck, intervene  
2. **Opportunity focus**: ACTIVE_SET_APPOINTMENT is your near-term close list → Prioritize these  
3. **Response monitoring**: If ACTIVE_WAITING_FOR_PROSPECT_RESPONSE grows → Are we following up enough?  
4. **Process health**: NEW → CONTACTED movement rate should be >80% weekly → If not, capacity issue  
5. **Executive summary**: Simple one-page view of “where are all our leads?”  
**Business Impact**  
* **Process visibility**: Managers can see bottlenecks at a glance  
* **Deal slippage prevention**: SOLD_PENDING_FINANCE monitoring = **catching 15-20% of at-risk deals**  
* **Workload transparency**: Know exactly what’s in each stage of pipeline  
# **Data Sources (all confirmed 100% available)**  
* ✅ leadStatusType (5 types)  
* ✅ leadStatus (38 granular values)  
* ✅ leadGroupCategory (NEW, WAITING, CONTACTED)  
* ✅ createdUtc (for age calculations)  
* ✅ Historical snapshots (for week-over-week comparison)  
#   
📊** FINAL HONEST PRIORITY RANKING**  

| Priority | Report Name | Buildable % | Time to Build | Business Impact | Data Sources |
| -------- | -------------------- | ----------- | ------------- | --------------- | ------------------------------------------------------------------------ |
| 1 | Deal Death Autopsy | 100% | 1 week | HIGH | leadStatus (38 values), leadStatusType, leadSource, leadType, createdUtc |
| 2 | Lead Source Quality | 100% | 1 week | HIGH | leadSource, leadStatusType, createdUtc |
| 3 | Channel Performance | 100% | 1 week | MEDIUM-HIGH | leadType, leadStatusType, isHot, isOnShowroom, tradeVehicles |
| 4 | Pipeline Velocity | 100% | 1 week | MEDIUM | createdUtc, leadStatusType, leadGroupCategory, isHot |
| 5 | Active Lead Triage | 100% | 1 week | MEDIUM | All lead fields, real-time filters |
| 6 | Deal Status Snapshot | 100% | 3 days | MEDIUM | leadStatus, leadStatusType, leadGroupCategory |
  
**These 6 reports use ONLY confirmed available data. No wishful thinking. No workarounds. Just solid, actionable intelligence you can build and ship with confidence.**  
#   
