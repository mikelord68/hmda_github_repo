export async function handler(event, context) {
  const lei = event.queryStringParameters.lei;
  if (!lei) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing LEI parameter." })
    };
  }
const url = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?institution=${lei}&years=2024`;
  console.log("Fetching LAR for LEI:", lei);
  console.log("Requesting URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: `Failed to fetch LAR data: ${res.statusText}`
      };
    }
    const text = await res.text();
    return {
      statusCode: 200,
      body: text,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
      }
    };
  } catch (err) {
    console.error("Fetch error:", err);
    return {
      statusCode: 500,
      body: "Server error while fetching LAR data."
    };
  }
}
