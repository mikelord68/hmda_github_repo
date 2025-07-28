
export async function handler(event, context) {
  try {
    const res = await fetch("https://ffiec.cfpb.gov/v2/data-browser-api/view/filers?years=2024");
    const data = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch lender data." })
    };
  }
}

