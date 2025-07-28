
document.addEventListener('DOMContentLoaded', () => {

async function fetchLARData(lei) {
    const year = "2023";
    const url = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?institution=${lei}&year=${year}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch LAR data.");
    const text = await response.text();
    return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

function getLoanTypeLabel(code) {
    const map = {
        '1': 'Conventional',
        '2': 'FHA-insured',
        '3': 'VA-guaranteed',
        '4': 'USDA Rural Housing Service'
    };
    return map[code] || `Code ${code}`;
}

function getLoanPurposeLabel(code) {
    const map = {
        '1': 'Home purchase',
        '2': 'Home improvement',
        '4': 'Refinancing',
        '31': 'Cash-out refinancing',
        '32': 'Other purpose'
    };
    return map[code] || `Code ${code}`;
}

function getActionTakenLabel(code) {
    const map = {
        '1': 'Loan originated',
        '2': 'Application approved but not accepted',
        '3': 'Application denied',
        '4': 'Application withdrawn by applicant',
        '5': 'File closed for incompleteness',
        '6': 'Purchased loan',
        '7': 'Preapproval request denied',
        '8': 'Preapproval request approved but not accepted'
    };
    return map[code] || `Code ${code}`;
}

function summarizeLAR(data) {
    const summary = {
        total: data.length,
        loanTypeCounts: {},
        loanPurposeCounts: {},
        actionTakenCounts: {},
        loanAmounts: []
    };

    data.forEach(row => {
        const loanType = row.loan_type;
        const loanPurpose = row.loan_purpose;
        const actionTaken = row.action_taken;
        const amount = parseFloat(row.loan_amount_000s);

        summary.loanTypeCounts[loanType] = (summary.loanTypeCounts[loanType] || 0) + 1;
        summary.loanPurposeCounts[loanPurpose] = (summary.loanPurposeCounts[loanPurpose] || 0) + 1;
        summary.actionTakenCounts[actionTaken] = (summary.actionTakenCounts[actionTaken] || 0) + 1;
        if (!isNaN(amount)) summary.loanAmounts.push(amount);
    });

    summary.avgLoanAmount = summary.loanAmounts.length > 0
        ? (summary.loanAmounts.reduce((a, b) => a + b, 0) / summary.loanAmounts.length).toFixed(1)
        : 'N/A';

    return summary;
}

function buildLARSummary(summary) {
    let html = `<h3>LAR Summary (${summary.total} records)</h3>`;

    html += "<h4>Loan Types</h4><ul>";
    for (const [type, count] of Object.entries(summary.loanTypeCounts)) {
        const label = getLoanTypeLabel(type);
        const pct = ((count / summary.total) * 100).toFixed(1);
        html += `<li>${label}: ${count} (${pct}%)</li>`;
    }
    html += "</ul>";

    html += "<h4>Loan Purposes</h4><ul>";
    for (const [purpose, count] of Object.entries(summary.loanPurposeCounts)) {
        const label = getLoanPurposeLabel(purpose);
        const pct = ((count / summary.total) * 100).toFixed(1);
        html += `<li>${label}: ${count} (${pct}%)</li>`;
    }
    html += "</ul>";

    html += "<h4>Action Taken</h4><ul>";
    for (const [action, count] of Object.entries(summary.actionTakenCounts)) {
        const label = getActionTakenLabel(action);
        const pct = ((count / summary.total) * 100).toFixed(1);
        html += `<li>${label}: ${count} (${pct}%)</li>`;
    }
    html += "</ul>";

    html += `<h4>Average Loan Amount</h4><p>${summary.avgLoanAmount} × $1,000</p>`;

    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    const lenderSelect = document.getElementById('lenderSelect');
    const fetchButton = document.getElementById('fetchLAR');
    const summaryContainer = document.getElementById('summary');
    const fileInput = document.getElementById('larFileInput');

    fetchButton.addEventListener('click', async () => {
        const selectedOption = lenderSelect.options[lenderSelect.selectedIndex];
        const lei = selectedOption.value;
        if (!lei) return;
        try {
            const data = await fetchLARData(lei);
            const summary = summarizeLAR(data);
            summaryContainer.innerHTML = buildLARSummary(summary);
        } catch (err) {
            summaryContainer.innerHTML = `<p>Error: ${err.message}</p>`;
        }
    });

    fileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
            const summary = summarizeLAR(data);
            summaryContainer.innerHTML = buildLARSummary(summary);
        };
        reader.readAsText(file);
    });
});

});
