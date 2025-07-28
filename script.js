document.addEventListener("DOMContentLoaded", () => {
  const fetchButton = document.getElementById("fetchLAR");
  const lenderInput = document.getElementById("lenderSelect");

  if (!fetchButton || !lenderInput) {
    console.error("Missing DOM elements. Make sure #fetchLAR and #lenderSelect exist.");
    return;
  }

  fetchButton.addEventListener("click", () => {
    const selectedName = lenderInput.value;
    const datalist = document.getElementById("lenderList");

    const match = Array.from(datalist.options).find(
      (opt) => opt.value === selectedName
    );

    if (!match) {
      displayOutput("Lender not found.");
      return;
    }

    const lei = match.dataset.lei;
    fetchLARData(lei);
  });

  fetchLenders(); // Load dropdown options
});

// Moved from global scope
async function fetchLenders() {
  try {
    const response = await fetch("/.netlify/functions/fetchLenders");
    if (!response.ok) throw new Error("Failed to fetch lenders.");
    const data = await response.json();
    populateLenderDropdown(data.lenders);
  } catch (error) {
    console.error(error);
    displayOutput("Failed to load lender list.");
  }
}

function populateLenderDropdown(lenders) {
  const datalist = document.getElementById("lenderList");
  datalist.innerHTML = "";

  lenders.forEach(lender => {
    const option = document.createElement("option");
    option.value = lender.name;
    option.dataset.lei = lender.lei;
    datalist.appendChild(option);
  });
}

function displayOutput(content) {
  const outputDiv = document.getElementById("output");
  outputDiv.textContent = content;
}

async function fetchLARData(lei) {
  displayOutput("Awaiting LAR data...");
  try {
    const response = await fetch(`/.netlify/functions/fetchLAR?lei=${lei}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }
    const data = await response.text();
    displayOutput(data);
  } catch (error) {
    console.error(error);
    displayOutput(`Failed to fetch LAR data: ${error.message}`);
  }
}
