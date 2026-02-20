# —>Staff Metrics  
  
**Staff Tiles - Dealership-Wide Trends That Salespeople Care About**  
# **Since we can't show "my performance," let's show market intelligence and competitive insights that help ALL salespeople sell better.**  
#   
**STAFF - 4 Tiles (Team-Wide Intelligence)**  
**Tile 1: Hot Opportunities Score (0-100)**  
# **What Salespeople Want: "Where should I focus my energy RIGHT NOW?"**  
**Data Used:**  
* isHot = true count  
* isOnShowroom = true count  
* leadGroupCategory = "NEW" + age < 24 hours  
* tradeVehicles array populated  
**Score Formula:**  
```
Hot Opportunities = 
  Hot Leads Awaiting Contact (NEW status) × 40 pts +
  Showroom Visitors Today × 30 pts +
  Fresh Leads with Trade-Ins (< 24h old) × 30 pts

```
**Modal Breakdown Shows:**  
* "12 hot leads need first contact (oldest: 8 hours ago)"  
* "3 customers on showroom floor right now"  
* "8 new leads with trade-ins came in today"  
* **Actionable:** "Prioritize these high-probability opportunities"  
# **Why Salespeople Care: Shows where the "easy money" is hiding in the pipeline right now.**  
#   
**Tile 2: What Customers Are Buying Score (0-100)**  
# **What Salespeople Want: "What should I be pitching? What's moving?"**  
**Data Used:**  
* make + model from vehicles of interest  
* inventoryType (NEW vs USED) trend  
* leadStatusType = SOLD (last 30 days)  
* msrp bands (where populated)  
**Score Formula:**  
```
Buying Trends Clarity =
  Top 3 Models Demand Concentration × 50 pts +
  New vs Used Preference Clarity (neither 45-55%) × 30 pts +
  Price Point Clarity (one band >40%) × 20 pts

```
**Modal Breakdown Shows:**  
* **Top 5 Models Customers Want:**  
    1. Honda CR-V (23 inquiries, 8 sold this month)  
    2. Toyota Camry (18 inquiries, 5 sold)  
    3. Ford F-150 (15 inquiries, 6 sold)  
* **New vs Used Split:** 68% NEW, 32% USED (trending toward NEW)  
* **Hot Price Range:** $30k-$45k (62% of inquiries)  
# **Why Salespeople Care: Tells them what to memorize specs on, what inventory to showcase, what customers are actually shopping for (not what management thinks they want).**  
#   
**Tile 3: Competitive Threat Alert Score (0-100)**  
# **What Salespeople Want: "Are we losing deals? Why?"**  
**Data Used:**  
* leadStatus granular LOST_* reasons  
* leadStatusType = LOST trend (30d vs previous 30d)  
* Loss rate by leadType (are internet leads bleeding out?)  
* leadGroupCategory = "WAITING" volume (prospects ghosting us)  
**Score Formula:**  
```
Competitive Pressure =
  (1 - LOST_PURCHASED_ELSEWHERE rate) × 50 pts +
  (1 - Loss Rate Growth vs Last Month) × 30 pts +
  (1 - WAITING Status Ratio) × 20 pts

```
**Modal Breakdown Shows:**  
* **Why We're Losing Deals:**  
    * LOST_PURCHASED_DIFFERENT_BRAND: 18 leads (up 25% vs last month) ⚠️  
    * LOST_NO_AGREEMENT_REACHED: 12 leads (pricing issues)  
    * LOST_DID_NOT_RESPOND: 8 leads (we're too slow)  
* **Ghosting Rate:** 23 leads in "WAITING" status > 7 days (customers went cold)  
* **Internet Lead Problem:** 35% loss rate (vs 18% walk-in) - digital follow-up failing  
# **Why Salespeople Care: Shows them the competition is eating their lunch and where the process is breaking down. Creates urgency.**  
#   
**Tile 4: Pipeline Urgency Score (0-100)**  
# **What Salespeople Want: "What deals are about to die if I don't act?"**  
**Data Used:**  
* createdUtc to calculate lead age  
* leadGroupCategory = "NEW" (uncontacted)  
* leadStatusType = "ACTIVE" aged > 14 days  
* isHot = true + age > 48 hours (hot leads cooling off)  
**Score Formula:**  
```
Pipeline Urgency =
  (1 - Overdue_New_Leads_Ratio) × 40 pts +
  (1 - Stale_Active_Leads_Ratio) × 35 pts +
  (1 - Cooling_Hot_Leads_Ratio) × 25 pts

```
**Modal Breakdown Shows:**  
* 🚨** URGENT - Need Contact NOW:**  
    * 7 NEW leads > 24 hours old (losing 5% close probability per hour)  
    * 3 HOT leads > 48 hours old (no longer hot)  
* ⚠️** WARNING - Stale Deals:**  
    * 18 ACTIVE leads > 14 days with no status change (dying on the vine)  
    * 12 ACTIVE leads > 30 days (statistically 89% will be lost)  
* 📊** Trend:** Pipeline aging 3.2 days faster than last month  
# **Why Salespeople Care: Creates FOMO and urgency. Shows them which deals they're about to lose if they don't act TODAY. Gamifies the race against time.**  
#   
**Summary: Staff Tile Philosophy**  
# **Since we can't show "your performance", we show:**  
1. **Hot Opportunities** (where to hunt)  
2. **Buying Intelligence** (what customers want)  
3. **Threats** (what's going wrong)  
4. **Urgency** (what's about to expire)  
# **This is competitive intelligence and tactical guidance that helps them sell better, even without personal attribution.**  
