# Salon/Spa Starter Kit — Spreadsheet Specifications

## Appointment Tracker (Google Sheets)
- **Layout:** Rows = 15-min time slots (8AM-8PM), Columns = Days of week
- **Each cell:** Client Name | Service | Stylist (color-coded by stylist)
- **Bottom row:** Daily totals (appointments, revenue, walk-ins, no-shows)
- **Tab per week** or rolling weekly view
- **Color coding:** Dropdown → conditional formatting by service type or stylist
- **Formulas:** COUNT appointments, SUM revenue, no-show rate

## Employee Schedule (Google Sheets)
- **Layout:** Rows = Employees (up to 10), Columns = Days of week
- **Each cell:** Start time - End time (e.g., 9:00-5:30)
- **Auto-calc columns:** Total hours/week, Overtime flag, Break assignment
- **Monthly tab:** PTO balance, Sick days used, Notes
- **Print-formatted** to fit standard paper landscape

## Revenue Tracker (Google Sheets)
### Columns:
| Col | Header | Notes |
|-----|--------|-------|
| A | Date | |
| B | Stylist/Tech | Dropdown |
| C | Client Name | |
| D | Service Category | Dropdown: Haircut, Color, Nails, Spa, Waxing, Makeup, Massage, Other |
| E | Service | Text |
| F | Service Revenue | Currency |
| G | Retail Sales | Currency |
| H | Tips | Currency |
| I | Total | Formula: =F+G |
| J | Payment Method | Dropdown: Cash, Credit, Debit, Venmo, Zelle, Gift Card |

### Summary Section:
- Daily total, weekly total, monthly total
- Revenue by service category (SUMIFS)
- Revenue by stylist
- Cash vs. card breakdown
- Average ticket value
- Retail-to-service ratio

## Inventory Tracker (Google Sheets)
### Professional Products Tab:
| Col | Header |
|-----|--------|
| A | Product Name |
| B | Brand |
| C | Size/Volume |
| D | Category (Color, Styling, Treatment, Shampoo, Nail, Skin, Wax, Other) |
| E | Cost Per Unit |
| F | Current Qty |
| G | Reorder Point |
| H | Status | Formula: =IF(F<=G,"⚠️ REORDER","✅ OK") |
| I | Supplier |
| J | Last Ordered |

### Retail Products Tab:
Same as above plus:
| K | Retail Price |
| L | Margin | Formula: =(K-E)/K |
| M | Qty Sold This Month |
| N | Revenue | Formula: =K*M |

## Expense Tracker (Google Sheets)
| Col | Header |
|-----|--------|
| A | Date |
| B | Category | Dropdown: Rent, Utilities, Products (Professional), Products (Retail), Equipment, Marketing, Insurance, Licenses/Permits, Education/Training, Supplies, Payroll, Software/Subscriptions, Repairs/Maintenance, Other |
| C | Description |
| D | Vendor |
| E | Amount |
| F | Payment Method |
| G | Tax Deductible | Yes/No |
| H | Receipt Saved | Checkbox |

### Monthly Summary: Total by category, monthly comparison, YTD total

## KPI Dashboard (Google Sheets)
### Key Metrics (auto-calculated):
- **Revenue per service hour** = Total service revenue / Total service hours
- **Average ticket** = Total revenue / Number of clients
- **Retail-to-service ratio** = Retail revenue / Service revenue
- **Client retention rate** = Returning clients / Total clients × 100
- **Rebooking rate** = Clients who rebooked / Total clients × 100
- **Chair utilization** = Booked hours / Available hours × 100
- **New client %** = New clients / Total clients × 100
- **No-show rate** = No-shows / Total appointments × 100

### Charts:
- Monthly revenue trend (line)
- Revenue by service category (pie)
- Stylist performance comparison (bar)
- KPI gauges vs. industry benchmarks
