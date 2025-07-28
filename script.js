document.addEventListener("DOMContentLoaded", () => {
  fetchLenders();

  document.getElementById("fetchLAR").addEventListener("click", () => {
    const dropdown = document.getElementById("lenderDropdown");
    const lei = dropdown.value;
    if (!lei) {
      displayOutput("Please select a lender.");
      return;
    }
    fetchLARData(lei);
  });

  document.getElementById("larFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data;
          if (!data || data.length === 0) {
            displayOutput("No LAR records found.");
            return;
          }
          const summaryHtml = buildLARSummary(data);
          displayOutput(summaryHtml);
        }
      });
    };
    reader.readAsText(file);
  });
});

function fetchLenders() {
  fetch("/.netlify/functions/fetchLenders")
    .then((res) => res.json())
    .then((data) => {
      const lenders = data.institutions || data.lenders || [];
      const dropdown = document.getElementById("lenderDropdown");
      lenders.forEach(lender => {
        const option = document.createElement("option");
        option.value = lender.lei;
        option.textContent = lender.name;
        dropdown.appendChild(option);
      });
    })
    .catch((err) => {
      console.error(err);
      displayOutput("Failed to load lender list.");
    });
}

async function fetchLARData(lei) {
  displayOutput("Awaiting LAR data...");
  try {
    const response = await fetch(`/.netlify/functions/fetchLAR?lei=${lei}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const csvText = await response.text();
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (!data || data.length === 0) {
          displayOutput("No LAR records found.");
          return;
        }

        const summaryHtml = buildLARSummary(data);
        displayOutput(summaryHtml);
      }
    });
  } catch (error) {
    console.error(error);
    displayOutput(`Failed to fetch LAR data: ${error.message}`);
  }
}

function buildLARSummary(data) {
  const loanTypeLabels = {
    "1": "Conventional",
    "2": "FHA-insured",
    "3": "VA-guaranteed",
    "4": "USDA Rural Housing Service or RHS"
  };

  const loanPurposeLabels = {
    "1": "Home purchase",
    "2": "Home improvement",
    "4": "Refinancing",
    "31": "Cash-out refinancing",
    "32": "Other purpose"
  };

  const actionTakenLabels = {
    "1": "Loan originated",
    "2": "Application approved but not accepted",
    "3": "Application denied",
    "4": "Application withdrawn by applicant",
    "5": "File closed for incompleteness",
    "6": "Purchased loan",
    "7": "Preapproval request denied",
    "8": "Preapproval request approved but not accepted"
  };

  const countBy = (field) => {
    const counts = {};
    data.forEach(row => {
      const value = row[field]?.trim() || "(missing)";
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  };

  const total = data.length;
  const loanTypeCounts = countBy("loan_type");
  const loanPurposeCounts = countBy("loan_purpose");
  const actionTakenCounts = countBy("action_taken");

  const loanAmounts = data.map(row => parseFloat(row.loan_amount_000s)).filter(n => !isNaN(n));
  const avgLoanAmount = loanAmounts.length
    ? (loanAmounts.reduce((a, b) => a + b, 0) / loanAmounts.length).toFixed(2)
    : "N/A";

  const summarize = (label, counts, labelsMap = {}) => {
    let html = `<h4>${label}</h4><ul>`;
    for (const [key, val] of Object.entries(counts)) {
      const pct = ((val / total) * 100).toFixed(1);
      const labelText = labelsMap[key] || `Code ${key}`;
      html += `<li>${labelText}: ${val} (${pct}%)</li>`;
    }
    html += "</ul>";
    return html;
  };

  return `
    <h3>LAR Summary (${total} records)</h3>
    ${summarize("Loan Types", loanTypeCounts, loanTypeLabels)}
    ${summarize("Loan Purposes", loanPurposeCounts, loanPurposeLabels)}
    ${summarize("Action Taken", actionTakenCounts, actionTakenLabels)}
    <h4>Average Loan Amount</h4>
    <p>${avgLoanAmount} × $1,000</p>
  `;
}


function displayOutput(content) {
  document.getElementById("output").innerHTML = content;
}
