# —>Org admin Metrics - Main - org admin  
  
  
Let me explain what I'm trying to do. That'll help you a little bit I think. I like your primary and tertiary display types. I don't like the traffic light though. What I'm trying to do is I realized that Claude has bastardized our original design. I have not looked at it since we did the design contract. When I went back to Replit and looked at what we had created, I had an epiphany. There were so many things that I thought about and that went into our work that were lost that I didn't even realize how much had changed and how far it has drifted off course. What I'm going to do is I'm going to go back to our original design with the chat being the first thing you see when you log in except I'm going to add metrics On that page, and I'm going to have 4 tiles at the top. These tiles are going to represent the scores for each roll. If the scores are clicked, it opens up a modal, it gives more information about the makeup, meaning that it shows real data that goes into the score itself. Then on that modal there'll be a page that will take them to the insights dashboard. The insights dashboard will have a top-level section of metrics, which are scores. that come from the data. That'll be separated into a second section which will have actual data fromrom various sources, starting with VIN solutions. This will not be true on the staff pages. They won't have the option to go to the Insights dashboard.   
  
**ORG ADMIN (Dealership Owner/GM) - 4 Tiles**  
**Tile 1: Pipeline Health Score (0-100)**  
**Data Used:**  
* leadStatusType distribution (ACTIVE/SOLD/LOST/BAD)  
* createdUtc for lead age calculation  
* leadGroupCategory (NEW/WAITING/CONTACTED)  
**Score Formula:**  
```
Pipeline Health = 
  Win Rate (SOLD/(SOLD+LOST)) × 50 pts +
  Active Pipeline Quality (1 - BAD/Total) × 30 pts +
  Pipeline Freshness (% ACTIVE < 30 days old) × 20 pts

```
# **Why This Works: All fields present, no timestamps needed, pure snapshot math.**  
#   
**Tile 2: Lead Source Performance Score (0-100)**  
**Data Used:**  
* leadSource (ID and name from /leadSources)  
* leadStatusType per source  
* Lead volume per source  
**Score Formula:**  
```
Source Performance =
  Top 3 Sources Win Rate × 40 pts +
  Source Diversity (# active sources, max 10) × 30 pts +
  Source Concentration Risk (penalty if top source >50%) × 30 pts

```
# **Why This Works: Category #8 is 95% buildable. Pure aggregation, no time dependencies.**  
#   
**Tile 3: Lead Quality Score (0-100)**  
**Data Used:**  
* leadStatusType = BAD rate  
* isHot flag presence  
* tradeVehicles array presence  
* vin populated in vehicles of interest  
**Score Formula:**  
```
Lead Quality =
  (1 - BAD_Rate) × 40 pts +
  Trade-In Penetration × 30 pts +
  In-Stock Match Rate (VIN populated) × 30 pts

```
# **Why This Works: All fields available, measures serious buyer signals.**  
#   
**Tile 4: Market Demand Insight Score (0-100)**  
**Data Used:**  
* inventoryType (NEW vs USED) distribution  
* make + model frequency from vehicles of interest  
* createdUtc for 30-day trend  
**Score Formula:**  
```
Market Insight =
  Demand Trend (30d growth vs previous 30d) × 50 pts +
  New/Used Balance (neither >75%) × 25 pts +
  Make Diversity (top 3 makes < 60%) × 25 pts

```
# **Why This Works: Category #4 at 60%, trend calculation possible from creation dates.**  
  
  

| Tile | Score | Buildability | Key Insight |
| ----------------------- | ----- | ------------ | --------------------------------------------------- |
| Pipeline Health | 0-100 | ✅ 90% | Are we converting leads and keeping pipeline fresh? |
| Lead Source Performance | 0-100 | ✅ 95% | Which sources work? Are we diversified? |
| Lead Quality | 0-100 | ✅ 85% | Are we attracting serious buyers? |
| Market Demand Insight | 0-100 | ✅ 70% | What are customers shopping for? Trends? |
  
