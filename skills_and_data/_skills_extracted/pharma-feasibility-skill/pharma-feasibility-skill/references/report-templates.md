# Feasibility Study Output Templates

## Standard Report Structure

Use this structure when generating the final feasibility study document:

```
FEASIBILITY STUDY REPORT
[Project Name] — [Company Name]
[Date] | [Version] | CONFIDENTIAL

═══════════════════════════════════════════
EXECUTIVE SUMMARY                           1 page
═══════════════════════════════════════════

1. PROJECT OVERVIEW
   1.1 Background & Rationale
   1.2 Project Scope & Objectives
   1.3 Product Description
   1.4 Geographic Target Market

2. MARKET ANALYSIS
   2.1 Global Market Overview
   2.2 Target Market Size & Growth
   2.3 Competitive Landscape
   2.4 Pricing Analysis
   2.5 Sales & Revenue Forecast (10-Year)

3. TECHNICAL FEASIBILITY
   3.1 Manufacturing Process Overview
   3.2 Facility Requirements
   3.3 Equipment Requirements
   3.4 Raw Material Supply Chain
   3.5 Quality & Regulatory Requirements
   3.6 Implementation Timeline

4. CAPITAL EXPENDITURE (CAPEX)
   4.1 Land & Civil Construction
   4.2 Manufacturing Equipment
   4.3 Quality Control Equipment
   4.4 Utilities & Infrastructure
   4.5 Soft Costs (Engineering, Validation, etc.)
   4.6 CAPEX Summary Table

5. OPERATING EXPENDITURE (OPEX)
   5.1 Cost of Goods Sold (COGS)
   5.2 Manufacturing Labor
   5.3 Utilities
   5.4 Maintenance
   5.5 Quality & Regulatory
   5.6 Sales, General & Administrative
   5.7 Annual OPEX Summary

6. FINANCIAL ANALYSIS
   6.1 Revenue Projections
   6.2 10-Year Income Statement
   6.3 Cash Flow Statement
   6.4 Key Financial Metrics (NPV, IRR, Payback)
   6.5 Break-Even Analysis
   6.6 Sensitivity Analysis

7. RISK ASSESSMENT
   7.1 Risk Register
   7.2 Risk Matrix
   7.3 Mitigation Strategies

8. CONCLUSION & RECOMMENDATION
   8.1 Go/No-Go Assessment
   8.2 Conditions & Next Steps

APPENDICES
   A. Detailed Equipment List
   B. Detailed Financial Assumptions
   C. Market Data Sources
   D. Regulatory Pathway Summary
```

---

## Data Status Legend

Always use these markers throughout the report:
- **[DOC]** — Data sourced from the user's uploaded document
- **[EST]** — Estimated by AI based on industry benchmarks (cite benchmark source)
- **[MKT]** — Sourced from market research / web search (cite source + date)
- **[USR]** — Confirmed by user during the study session
- **[TBC]** — To be confirmed — flag for user to verify before finalizing

---

## Sensitivity Analysis Table Template

| Variable | Base Case | -20% | -10% | +10% | +20% |
|---|---|---|---|---|---|
| Selling Price | $X | NPV=$? IRR=?% | | | |
| API Cost | $X | | | | |
| Utilization Rate | 85% | | | | |
| CAPEX | $X | | | | |
| Launch Delay (+1yr) | 0 | NPV=$? | — | — | — |

---

## Break-Even Analysis Formula

**Break-Even Volume (units)**
= Fixed Costs ÷ (Selling Price per unit − Variable Cost per unit)

**Break-Even Revenue**
= Fixed Costs ÷ Gross Margin %

**Break-Even Year**
= Year when cumulative cash flow turns positive (from financial model)

---

## NPV / IRR Quick Reference

**NPV Formula**: Σ [FCFt / (1+r)^t] − Initial Investment
- If NPV > 0: Project creates value → GO
- If NPV < 0: Project destroys value → NO-GO
- If NPV near 0: Marginal → evaluate strategic rationale

**IRR**: Discount rate at which NPV = 0
- Compare to company hurdle rate / WACC
- Pharma benchmark: IRR > 15% for generic, > 20% for specialty

**Payback Period**: Years to recover initial investment from net cash flows
- Pharma generic benchmark: 5–8 years acceptable
- Specialty/niche: 3–6 years expected
