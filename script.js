
async function fetchInstitutions() {
  try {
    const res = await fetch("/.netlify/functions/fetchLenders");
    const data = await res.json();
    const select = document.getElementById("lenderDropdown");
    select.innerHTML = "";
    data.filers.sort((a, b) => a.name.localeCompare(b.name));
    data.filers.forEach(filer => {
      const opt = document.createElement("option");
      opt.value = filer.lei;
      opt.textContent = filer.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading lender list", err);
    document.getElementById("lenderDropdown").innerHTML = '<option>Error loading lenders</option>';
  }
}

async function fetchLAR() {
  const lei = document.getElementById("lenderDropdown").value;
  if (!lei) return alert("Please select a lender.");
  const url = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv/${lei}/2024`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    document.getElementById("output").textContent = text.slice(0, 1000) + "\n... (truncated)";
  } catch (err) {
    alert("Failed to fetch LAR file.");
  }
}

document.getElementById("larFile").addEventListener("change", function(e) {
  const reader = new FileReader();
  reader.onload = function() {
    document.getElementById("output").textContent = reader.result.slice(0, 1000) + "\n... (truncated)";
  };
  reader.readAsText(e.target.files[0]);
});

fetchInstitutions();
