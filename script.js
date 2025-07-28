document.addEventListener("DOMContentLoaded", function () {
  const lenderSelect = document.getElementById("lenderSelect");
  const fetchButton = document.getElementById("fetchButton");
  const fileInput = document.getElementById("fileInput");
  const summaryContainer = document.getElementById("summaryContainer");
  const output = document.getElementById("output");

  const actionTakenMap = {
    "1": "Loan originated",
    "2": "Application approved but not accepted",
    "3": "Application denied",
    "4": "Application withdrawn",
    "5": "File closed for incompleteness",
    "6": "Purchased loan",
    "7": "Preapproval request denied",
    "8": "Preapproval request approved but not accepted"
  };

  const loanTypeMap = {
    "1": "Conventional",
    "2": "FHA-insured",
    "3": "VA-guaranteed",
    "4": "USDA/RHS"
  };

  const loanPurposeMap = {
    "1": "Home purchase",
    "2": "Home improvement",
    "4": "Refinancing",
    "31": "Cash-out refinancing"
  };

  fetch("/.netlify/functions/fetchLenders")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        data.forEach(lender => {
          const option = document.createElement("option");
          option.value = lender.lei;
          option.textContent = lender.name;
          lenderSelect.appendChild(option);
        });
      } else {
        throw new Error("Invalid lender data.");
      }
    })
    .catch(err => {
      console.error("Error loading lenders:", err);
      lenderSelect.innerHTML = '<option>Error loading lenders</option>';
    });

  fetchButton.addEventListener("click", () => {
    const lei = lenderSelect.value;
    if (!lei || lei.includes("Error")) return;

    fetch(`https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?institution=${lei}&year=2024`)
      .then(response => response.text())
      .then(csvData => {
        parseAndDisplaySummary(csvData);
        prepareDownload(csvData, `HMDA_LAR_${lei}.csv`);
      })
      .catch(err => {
        console.error("Failed to fetch LAR data.", err);
        summaryContainer.innerHTML = "<p>Failed to fetch LAR data.</p>";
      });
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const csvData = e.target.result;
      parseAndDisplaySummary(csvData);
      prepareDownload(csvData, file.name);
    };
    reader.readAsText(file);
  });

  function parseAndDisplaySummary(csvData) {
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    const data = parsed.data;

    const loanTypeCounts = {};
    const loanPurposeCounts = {};
    const actionTakenCounts = {};
    let totalLoanAmount = 0;
    let loanAmountCount = 0;

    data.forEach(row => {
      const loanType = row.loan_type;
      const loanPurpose = row.loan_purpose;
      const actionTaken = row.action_taken;
      const loanAmount = parseFloat(row.loan_amount_000s);

      loanTypeCounts[loanType] = (loanTypeCounts[loanType] || 0) + 1;
      loanPurposeCounts[loanPurpose] = (loanPurposeCounts[loanPurpose] || 0) + 1;
      actionTakenCounts[actionTaken] = (actionTakenCounts[actionTaken] || 0) + 1;

      if (!isNaN(loanAmount)) {
        totalLoanAmount += loanAmount;
        loanAmountCount++;
      }
    });

    const totalRecords = data.length;
    const averageLoanAmount = loanAmountCount ? (totalLoanAmount / loanAmountCount).toFixed(2) : "N/A";

    const html = [];

    html.push(`<h3>LAR Summary (${totalRecords} records)</h3>`);

    html.push("<h4>Loan Types</h4><ul>");
    for (const [type, count] of Object.entries(loanTypeCounts)) {
      const label = loanTypeMap[type] || `Code ${type}`;
      html.push(`<li>${label}: ${count} (${percent(count, totalRecords)}%)</li>`);
    }
    html.push("</ul>");

    html.push("<h4>Loan Purposes</h4><ul>");
    for (const [purpose, count] of Object.entries(loanPurposeCounts)) {
      const label = loanPurposeMap[purpose] || `Code ${purpose}`;
      html.push(`<li>${label}: ${count} (${percent(count, totalRecords)}%)</li>`);
    }
    html.push("</ul>");

    html.push("<h4>Action Taken</h4><ul>");
    for (const [action, count] of Object.entries(actionTakenCounts)) {
      const label = actionTakenMap[action] || `Code ${action}`;
      html.push(`<li>${label}: ${count} (${percent(count, totalRecords)}%)</li>`);
    }
    html.push("</ul>");

    html.push(`<h4>Average Loan Amount ($000s): ${averageLoanAmount}</h4>`);

    summaryContainer.innerHTML = html.join("");
  }

  function percent(count, total) {
    return ((count / total) * 100).toFixed(1);
  }

  function prepareDownload(content, filename) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    output.innerHTML = `<a href="${url}" download="${filename}">Download LAR CSV</a>`;
  }
});
