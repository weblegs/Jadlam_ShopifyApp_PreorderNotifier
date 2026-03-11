import db from "../db.server";

const GADGET_API_URL =
  "https://wl-preorder-notify--development.gadget.app/api/graphql";
const GADGET_API_KEY = "gsk-Wiqja4wtxm4Xqf3AeCLEKYUcp72WnW7n";
const DEFAULT_SHOP = "wljadlamracing.myshopify.com";
const SECRET = process.env.MIGRATE_SECRET;

const QUERY = `
  query GetAllPreorders($after: String) {
    preorderDatas(first: 250, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node { id email sku title vendor createdAt }
      }
    }
  }
`;

async function fetchPage(after = null) {
  const res = await fetch(GADGET_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GADGET_API_KEY}`,
    },
    body: JSON.stringify({ query: QUERY, variables: { after } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.preorderDatas;
}

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!SECRET || secret !== SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let allRecords = [];
  let after = null;

  while (true) {
    const page = await fetchPage(after);
    allRecords = allRecords.concat(page.edges.map((e) => e.node));
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }

  let inserted = 0;
  let skipped = 0;

  for (const record of allRecords) {
    const existing = await db.preorderData.findFirst({
      where: { email: record.email, sku: record.sku },
    });
    if (existing) { skipped++; continue; }

    await db.preorderData.create({
      data: {
        shop: DEFAULT_SHOP,
        email: record.email ?? "",
        sku: record.sku ?? "",
        title: record.title ?? "",
        vendor: record.vendor ?? "",
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
      },
    });
    inserted++;
  }

  return Response.json({
    total: allRecords.length,
    inserted,
    skipped,
  });
};
