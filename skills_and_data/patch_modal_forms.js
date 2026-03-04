const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Unit Rate to Sales Modal
const oldSalesForm = `                <div className="grid grid-cols-3 gap-4">
                  {renderField('Qty (KG)', 'quantity', 'number')}
                  {renderField('Amt (USD)', 'amountUSD', 'number')}
                  {renderField('Amt (OMR)', 'amountOMR', 'number')}
                </div>`;

const newSalesForm = `                <div className="grid grid-cols-2 gap-4">
                  {renderField('Qty (KG)', 'quantity', 'number')}
                  {renderField('Unit Rate (USD/KG)', 'rateUSD', 'number')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Amt (USD)', 'amountUSD', 'number')}
                  {renderField('Amt (OMR)', 'amountOMR', 'number')}
                </div>`;

if (content.includes(oldSalesForm)) {
    content = content.replace(oldSalesForm, newSalesForm);
    console.log('Successfully patched Sales Modal with Unit Rate.');
} else {
    // Attempt with different spacing
    const regex = /<div className="grid grid-cols-3 gap-4">\s*\{renderField\('Qty \(KG\)', 'quantity', 'number'\)\}\s*\{renderField\('Amt \(USD\)', 'amountUSD', 'number'\)\}\s*\{renderField\('Amt \(OMR\)', 'amountOMR', 'number'\)\}\s*<\/div>/;
    if (content.match(regex)) {
        content = content.replace(regex, newSalesForm);
        console.log('Successfully patched Sales Modal via regex.');
    } else {
        console.log('Could not find Sales Modal form structure.');
    }
}

// 2. Add BD and Samples Modal sections if missing
const bdSection = `            {currentSection === 'bd' && (
              <>
                {renderField('Target Market', 'targetMarket')}
                {renderField('Opportunity', 'opportunity')}
                {renderField('Potential Value', 'potentialValue')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Status', 'status', 'select', ['Prospecting', 'Negotiation', 'Contracting', 'Closed'])}
                  {renderField('Probability (%)', 'probability', 'number')}
                </div>
              </>
            )}`;

const samplesSection = `            {currentSection === 'samples' && (
              <>
                {renderField('Product Name', 'product')}
                {renderField('Destination', 'destination')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Quantity', 'quantity')}
                  {renderField('Status', 'status', 'select', ['Requested', 'Production', 'QC Testing', 'Dispatched', 'Arrived'])}
                </div>
                {renderField('Tracking Number', 'trackingNumber')}
              </>
            )}`;

if (!content.includes("currentSection === 'bd'")) {
    const insertionPoint = content.indexOf("{currentSection === 'production'");
    if (insertionPoint > -1) {
        content = content.substring(0, insertionPoint) + bdSection + "\n\n            " + samplesSection + "\n\n            " + content.substring(insertionPoint);
        console.log('Added BD and Samples modal sections.');
    }
}

fs.writeFileSync(filePath, content);
console.log('Patching complete.');
