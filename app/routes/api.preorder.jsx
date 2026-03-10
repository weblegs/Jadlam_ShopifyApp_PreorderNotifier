import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const { email, title, vendor, sku } = await request.json();

    if (!email) {
      return Response.json(
        { success: false, errors: [{ message: "Email is required" }] },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Identify the shop from the storefront origin (e.g. https://mystore.myshopify.com)
    const origin = request.headers.get("Origin") ?? "";
    const shopMatch = origin.match(/https?:\/\/([^/]+)/);
    const shop = shopMatch?.[1] ?? "unknown";

    await db.preorderData.create({
      data: {
        shop,
        email,
        title: title ?? "",
        vendor: vendor ?? "",
        sku: sku ?? "",
      },
    });

    return Response.json({ success: true, errors: [] }, { headers: CORS_HEADERS });
  } catch {
    return Response.json(
      { success: false, errors: [{ message: "Server error" }] },
      { status: 500, headers: CORS_HEADERS },
    );
  }
};

// Return 405 for GET requests
export const loader = async () => {
  return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
};
