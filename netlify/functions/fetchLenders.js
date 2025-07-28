export async function handler(event, context) {
  const url = "https://ffiec.cfpb.gov/v2/data-browser-api/institutions/2024";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch institutions." })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ institutions: data.institutions }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error fetching lenders." })
    };
  }
}
