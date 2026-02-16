# Restaurant Inventory Tracker — Spreadsheet Specifications

## Sheet 1: Master Inventory

### Columns
| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Item Name | Text | |
| B | Category | Dropdown | Protein, Produce, Dairy, Dry Goods, Frozen, Beverage, Supplies |
| C | Unit | Dropdown | lb, oz, each, dozen, case, gal, qt, pt, box, roll, can, bottle, keg, bag |
| D | Cost Per Unit | Currency | $0.00 |
| E | Par Level | Number | Minimum stock level |
| F | Current Qty | Number | Updated during counts |
| G | Total Value | Formula | =D*F |
| H | Status | Formula | =IF(F<E,"⚠️ LOW STOCK",IF(F<E*1.2,"REORDER SOON","✅ OK")) |
| I | Storage Location | Dropdown | Walk-In Cooler, Freezer, Dry Storage, Bar, Line |
| J | Supplier | Text | |
| K | Last Updated | Date | |
| L | Notes | Text | |

### Conditional Formatting
- Row turns RED when Status = "⚠️ LOW STOCK"
- Row turns YELLOW when Status = "REORDER SOON"
- Row stays WHITE/GREEN when Status = "✅ OK"

---

## Sheet 2: Food Cost Calculator

### Columns
| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Menu Item | Text | Dish name |
| B | Menu Price | Currency | What customer pays |
| C | Ingredient 1 | Text | |
| D | Qty Used | Number | |
| E | Unit | Text | |
| F | Unit Cost | Formula | =VLOOKUP(C,Inventory!A:D,4,FALSE) |
| G | Ingredient Cost | Formula | =D*F |
| ... | (Repeat for up to 15 ingredients per recipe) | | |
| X | Total Food Cost | Formula | =SUM of all ingredient costs |
| Y | Food Cost % | Formula | =X/B (formatted as %) |
| Z | Profit Per Plate | Formula | =B-X |
| AA | Status | Formula | =IF(Y>0.35,"⚠️ OVER TARGET",IF(Y>0.30,"WATCH","✅ GOOD")) |

### Target: Food cost should be 28-32% for most restaurants

---

## Sheet 3: Waste Log

### Columns
| Col | Header | Type |
|-----|--------|------|
| A | Date | Date |
| B | Item Name | Text/Dropdown (from Inventory) |
| C | Quantity Wasted | Number |
| D | Unit | Auto-fill from Inventory |
| E | Cost Per Unit | Auto-fill from Inventory |
| F | Waste Cost | Formula: =C*E |
| G | Reason | Dropdown: Expired, Spoiled, Overproduction, Dropped/Spilled, Quality Issue, Other |
| H | Notes | Text |

### Summary Section (below or sidebar)
- Total waste this week: =SUMIFS(F, A, ">="&weekstart)
- Total waste this month: =SUMIFS(F, A, ">="&monthstart)
- Top 5 wasted items (by cost)
- Waste by reason (pivot-style)

---

## Sheet 4: Reorder Calculator

### Columns
| Col | Header | Formula |
|-----|--------|---------|
| A | Item Name | =Inventory!A (linked) |
| B | Current Qty | =Inventory!F (linked) |
| C | Par Level | =Inventory!E (linked) |
| D | Need to Order? | =IF(B<C,"YES","No") |
| E | Suggested Order Qty | =IF(B<C, C*1.5-B, 0) — order to 150% of par |
| F | Est. Cost Per Unit | =Inventory!D (linked) |
| G | Est. Order Cost | =E*F |
| H | Supplier | =Inventory!J (linked) |
| I | Order Placed? | Checkbox |
| J | Date Ordered | Date (manual) |

### Filter: Show only items where D = "YES"
### Total estimated order cost at bottom

---

## Sheet 5: Supplier Directory

### Columns
| Col | Header |
|-----|--------|
| A | Company Name |
| B | Contact Person |
| C | Phone |
| D | Email |
| E | Account Number |
| F | Payment Terms |
| G | Delivery Days |
| H | Minimum Order |
| I | Website |
| J | Notes |

---

## Sheet 6: Dashboard

### Key Metrics (large number boxes)
- Total Inventory Value: =SUM(Inventory!G:G)
- Items Below Par: =COUNTIF(Inventory!H:H,"⚠️ LOW STOCK")
- Items to Reorder: =COUNTIF(Reorder!D:D,"YES")
- This Month's Waste Cost: =from Waste Log
- Average Food Cost %: =AVERAGE(FoodCost!Y:Y)

### Charts
- Pie: Inventory Value by Category
- Bar: Top 10 Most Expensive Items
- Line: Weekly Waste Trend
- Gauge-style: Average Food Cost % vs Target

---

## Sheet 7: Count Sheet

### Layout (print-optimized)
- Grouped by Storage Location
- Columns: Item Name | Unit | Par Level | Count (blank for writing) | Variance
- Variance = Count - Par Level (filled in after counting)
- Header with: Date, Counted By, Verified By
- Large font, generous row height for clipboard use
