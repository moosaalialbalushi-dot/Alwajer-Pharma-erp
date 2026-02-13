# New Data Structure Requirements

## 1. Inventory (Raw Materials)
Based on `IMG_0488.jpeg`:
- **S.No**: Serial number
- **Name of Material**: Material name
- **Required Material for Present Orders**: Quantity needed
- **Present Stock**: Current stock as of a specific date (e.g., 31.12.25)
- **Balance RM to be Purchase**: Difference (Required - Present)

## 2. Sales (Orders)
Based on `Sales-(20-11-2025).xlsx`:
- **Sno**: Serial number
- **Date**: Invoice date
- **Invoice No.**: Invoice number
- **Party**: Customer name
- **LC No / BIC No**: Financial details
- **Country**: Destination
- **Product**: Product name
- **Qty (KG)**: Quantity
- **Rate $**: Unit price in USD
- **Amount $**: Total in USD
- **Amount (OMR)**: Total in OMR
- **Status**: Payment/Shipping status

## 3. Product Costing (R&D / Formulation)
Based on `IMG_0498.jpeg`:
- **Output**: Total batch size (e.g., 100.00 Kg)
- **Raw Material**: List of ingredients
- **Unit**: Unit of measurement (e.g., Kg)
- **Per B. Qty**: Quantity per batch
- **Rate USD**: Unit cost in USD
- **Cost**: Total cost for that ingredient (Qty * Rate)
- **Total RMC**: Sum of ingredient costs
- **Loss**: Percentage or fixed amount (e.g., 0.02)
- **Total final RMC**: Final cost after loss (Total RMC + Loss)
