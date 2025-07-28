export async function handler(event, context) {
  const lei = event.queryStringParameters?.lei;
  if (!lei) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing LEI parameter." })
    };
  }

  const url = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?leis=${lei}&years=2024`;

  try {
    const response = await fetch(url); // native fetch (Node 18+)
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: `Failed to fetch LAR data: ${response.statusText}`
      };
    }

    const text = await response.text();
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

