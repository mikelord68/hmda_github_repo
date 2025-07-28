import { fetchLenders } from './fetchLenders.js';
import { fetchLAR } from './fetchLAR.js';

document.addEventListener('DOMContentLoaded', () => {
  const lenderSelect = document.getElementById('lenderSelect');
  const fetchButton = document.getElementById('fetchButton');
  const fileInput = document.getElementById('fileInput');
  const summaryContainer = document.getElementById('summaryContainer');

  // Populate lender dropdown
  fetchLenders()
    .then(lenders => {
      lenders.sort((a, b) => a.name.localeCompare(b.name));
      lenders.forEach(lender => {
        const option = document.createElement('option');
        option.value = lender.lei;
        option.textContent = lender.name;
        lenderSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading lenders:', error);
      const option = document.createElement('option');
      option.textContent = 'Error loading lenders';
      lenderSelect.appendChild(option);
    });

  // Fetch LAR from API by selected LEI
  fetchButton.addEventListener('click', async () => {
    const lei = lenderSelect.value;
    if (!lei) return;
    summaryContainer.textContent = 'Loading...';

    try {
      const data = await fetchLAR(lei);
      displaySummary(data);
    } catch (error) {
      console.error('Failed to fetch LAR:', error);
      summaryContainer.textContent = 'Failed to fetch LAR data.';
    }
  });

  // Handle local LAR file upload
  if (fileInput) {
    fileInput.addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const json = JSON.parse(e.target.result);
          displaySummary(json);
        } catch (error) {
          console.error('Error parsing uploaded file:', error);
          summaryContainer.textContent = 'Invalid JSON in uploaded file.';
        }
      };
      reader.readAsText(file);
    });
  }

  // Basic summary display function (placeholder)
  function displaySummary(data) {
    summaryContainer.textContent = `LAR Summary (${data.length} records)`;
    // You can insert detailed formatting logic here
  }
});
