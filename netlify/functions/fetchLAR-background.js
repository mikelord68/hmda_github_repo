const fetch = require("node-fetch"); // or global fetch if using newer Netlify Node env

exports.handler = async function(event, context, callback) {
  const lei = event.queryStringParameters.lei;
  if (!lei) {
    return callback(null, {
      statusCode: 400,
      body: "Missing LEI parameter."
    });
  }

  const url = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?leis=${lei}&years=2024`;
  console.log("Fetching LAR for LEI:", lei);
  console.log("Requesting URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return callback(null, {
        statusCode: res.status,
        body: `Failed to fetch LAR data: ${res.statusText}`
      });
    }

    const csv = await res.text();

    return callback(null, {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv",
        "Access-Control-Allow-Origin": "*"
      },
      body: csv
    });
  } catch (err) {
    console.error("Fetch error:", err);
    return callback(null, {
      statusCode: 500,
      body: "Server error while fetching LAR data."
    });
  }
};
