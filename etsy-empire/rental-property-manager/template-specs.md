# Rental Property Manager — Spreadsheet Specifications

## Sheet 1: Property Portfolio
| Col | Header | Type | Formula/Notes |
|-----|--------|------|---------------|
| A | Property Address | Text | |
| B | Property Type | Dropdown | SFH, Duplex, Triplex, Fourplex, Condo, Apartment, Townhouse |
| C | Units | Number | |
| D | Purchase Price | Currency | |
| E | Purchase Date | Date | |
| F | Current Value | Currency | |
| G | Appreciation | Formula | =(F-D)/D |
| H | Mortgage Balance | Currency | |
| I | Monthly PITI | Currency | Principal, Interest, Tax, Insurance |
| J | Equity | Formula | =F-H |
| K | LTV | Formula | =H/F |
| L | Total Monthly Rent | Formula | =SUMIFS(Tenants!rent, Tenants!property, A) |
| M | Monthly Cash Flow | Formula | =L-I |
| N | Notes | Text | |

**Summary Row:** Total portfolio value, total equity, total monthly rent, total cash flow

## Sheet 2: Tenant Directory
| Col | Header | Type | Formula/Notes |
|-----|--------|------|---------------|
| A | Tenant Name | Text | |
| B | Property | Dropdown (from Portfolio) | |
| C | Unit | Text | |
| D | Phone | Text | |
| E | Email | Text | |
| F | Emergency Contact | Text | |
| G | Lease Start | Date | |
| H | Lease End | Date | |
| I | Days Remaining | Formula | =H-TODAY() |
| J | Lease Alert | Formula | =IF(I<30,"⚠️ EXPIRING",IF(I<60,"RENEW SOON",IF(I<90,"PLAN AHEAD","✅ OK"))) |
| K | Monthly Rent | Currency | |
| L | Security Deposit | Currency | |
| M | Status | Dropdown | Active, Month-to-Month, Notice Given, Vacant, Eviction |
| N | Move-In Date | Date | |
| O | Notes | Text | |

**Conditional Formatting:** Row red if I<30, yellow if I<60, green if active

## Sheet 3: Rent Roll (Monthly Grid)
- Rows: Each tenant
- Columns grouped by month: Due | Paid | Date Paid | Balance | Method
- Formula: Balance = Due - Paid
- Conditional: Red if balance > 0 past due date
- Monthly total row, annual total column
- Vacancy row for each vacant unit (lost income)

## Sheet 4: Maintenance Log
| Col | Header | Type |
|-----|--------|------|
| A | Date Reported | Date |
| B | Property | Dropdown |
| C | Unit | Text |
| D | Description | Text |
| E | Priority | Dropdown: Emergency, Urgent, Routine, Cosmetic |
| F | Status | Dropdown: Reported, Scheduled, In Progress, Completed, Cancelled |
| G | Assigned To | Text |
| H | Vendor Phone | Text |
| I | Date Scheduled | Date |
| J | Date Completed | Date |
| K | Estimated Cost | Currency |
| L | Actual Cost | Currency |
| M | Warranty | Dropdown: Yes, No, Pending |
| N | Notes | Text |

## Sheet 5: Expense Tracker
| Col | Header | Type |
|-----|--------|------|
| A | Date | Date |
| B | Property | Dropdown |
| C | Category | Dropdown (Schedule E categories) |
| D | Description | Text |
| E | Vendor | Text |
| F | Amount | Currency |
| G | Payment Method | Dropdown |
| H | Receipt | Checkbox |
| I | Tax Deductible | Dropdown: Yes, No, Partial |
| J | Notes | Text |

**Categories (matching Schedule E):** Advertising, Auto/Travel, Cleaning/Maintenance, Commissions, Insurance, Legal/Professional, Management Fees, Mortgage Interest, Other Interest, Repairs, Supplies, Taxes, Utilities, Depreciation, Other

## Sheet 6: P&L Per Property
- One section per property (or one row per property with monthly columns)
- **Income rows:** Rent, Late Fees, Pet Fees, Parking, Laundry, Other
- **Expense rows:** Auto-summed from Expense Tracker by category
- **Calculations:**
  - Gross Income = Sum of all income
  - Total Expenses = Sum of all expenses
  - NOI = Gross Income - Operating Expenses (excluding mortgage)
  - Cash Flow = NOI - Mortgage Payment
  - Cap Rate = NOI / Property Value
  - Cash-on-Cash = Annual Cash Flow / Total Cash Invested

## Sheet 7: Lease Expiration Calendar
- Sorted by lease end date (ascending)
- Columns: Property, Unit, Tenant, Lease End, Days Remaining, Current Rent, Proposed New Rent, Increase %, Renewal Status, Notes
- Renewal Status dropdown: Not Started, In Negotiation, Renewed, Vacating, Month-to-Month

## Sheet 8: Portfolio Dashboard
- **KPI boxes:** Total Properties, Total Units, Occupied Units, Vacancy Rate, Monthly Income, Monthly Expenses, Monthly Cash Flow, YTD NOI
- **Charts:**
  - Bar: Monthly Cash Flow per Property
  - Pie: Expenses by Category
  - Line: Monthly Income vs Expenses (12-month trend)
  - Table: Upcoming Lease Expirations (next 90 days)
  - Table: Open Maintenance Requests
