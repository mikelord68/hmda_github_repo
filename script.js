const lenderSelect = document.getElementById("lenderSelect");
const larFileInput = document.getElementById("larFileInput");
const summaryDiv = document.getElementById("summary");
const downloadButton = document.getElementById("downloadSummary");

const actionTakenLabels = {
    1: "Loan originated",
    2: "Application approved but not accepted",
    3: "Application denied",
    4: "Application withdrawn",
    5: "File closed for incompleteness",
    6: "Purchased loan",
    7: "Preapproval request denied",
    8: "Preapproval request approved but not accepted"
};

const loanTypeLabels = {
    1: "Conventional (not insured or guaranteed)",
    2: "FHA-insured",
    3: "VA-guaranteed",
    4: "USDA Rural Housing Service or RHS"
};

const loanPurposeLabels = {
    1: "Home purchase",
    2: "Home improvement",
    4: "Refinancing",
    31: "Cash-out refinancing"
};

document.addEventListener("DOMContentLoaded", fetchLenders);
larFileInput.addEventListener("change", handleFileUpload);
downloadButton.addEventListener("click", () => {
    const csvContent = downloadButton.dataset.csv;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LAR_summary.csv";
    link.click();
});

function fetchLenders() {
    fetch("/.netlify/functions/fetchLenders")
        .then((res) => res.json())
        .then((data) => {
            const lenders = data.institutions.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            lenders.forEach(({ lei, name }) => {
                const option = document.createElement("option");
                option.value = lei;
                option.textContent = name;
                lenderSelect.appendChild(option);
            });
        })
        .catch((err) => console.error("Failed to fetch lenders", err));
}

function fetchLAR() {
    const lei = lenderSelect.value;
    summaryDiv.innerHTML = "Loading...";
    fetch(`/.netlify/functions/fetchLAR?lei=${lei}`)
        .then((res) => res.json())
        .then((data) => {
            summarizeLAR(data);
        })
        .catch((err) => {
            summaryDiv.innerHTML = "Failed to fetch LAR data.";
            console.error(err);
        });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const lines = e.target.result.split("\n");
        const headers = lines[0].split(",");
        const data = lines.slice(1).map(line => {
            const values = line.split(",");
            const row = {};
            headers.forEach((h, i) => row[h] = values[i]);
            return row;
        });
        summarizeLAR(data);
    };
    reader.readAsText(file);
}

function summarizeLAR(data) {
    const total = data.length;
    const counts = { loan_type: {}, loan_purpose: {}, action_taken: {} };
    let sumLoanAmount = 0;

    data.forEach(row => {
        const lt = row.loan_type;
        const lp = row.loan_purpose;
        const at = row.action_taken;

        counts.loan_type[lt] = (counts.loan_type[lt] || 0) + 1;
        counts.loan_purpose[lp] = (counts.loan_purpose[lp] || 0) + 1;
        counts.action_taken[at] = (counts.action_taken[at] || 0) + 1;

        sumLoanAmount += parseFloat(row.loan_amount_000s || 0);
    });

    const avgLoanAmount = (sumLoanAmount / total).toFixed(2);

    let html = `<h3>LAR Summary (${total} records)</h3>`;
    const lines = [`Metric,Code,Label,Count,Percent`];

    function renderSection(title, map, labels) {
        html += `<h4>${title}</h4><ul>`;
        Object.entries(map).forEach(([key, count]) => {
            const pct = ((count / total) * 100).toFixed(1);
            const label = labels[key] || "Unknown";
            html += `<li>${label}: ${count} (${pct}%)</li>`;
            lines.push(`${title},${key},${label},${count},${pct}%`);
        });
        html += "</ul>";
    }

    renderSection("Loan Types", counts.loan_type, loanTypeLabels);
    renderSection("Loan Purposes", counts.loan_purpose, loanPurposeLabels);
    renderSection("Action Taken", counts.action_taken, actionTakenLabels);

    html += `<h4>Average Loan Amount: $${avgLoanAmount}k</h4>`;
    lines.push(`Average Loan Amount,,,$${avgLoanAmount}k`);

    summaryDiv.innerHTML = html;
    downloadButton.dataset.csv = lines.join("\n");
    downloadButton.style.display = "inline-block";
}
