import { useLoaderData, Form } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const entries = await db.preorderData.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return { entries };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  await db.preorderData.deleteMany({
    where: { id: String(formData.get("id")), shop: session.shop },
  });

  return null;
};

export default function PreorderList() {
  const { entries } = useLoaderData();

  return (
    <s-page heading="Preorder Notifications">
      <s-section heading={`Entries (${entries.length})`}>
        {entries.length === 0 ? (
          <s-paragraph>No preorder entries yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {entries.map((entry) => (
              <s-box
                key={entry.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" align="space-between">
                  <s-stack direction="block" gap="tight">
                    <s-text emphasis="strong">{entry.email}</s-text>
                    <s-text subdued>
                      {entry.title} · {entry.vendor} · SKU: {entry.sku}
                    </s-text>
                  </s-stack>
                  <Form method="post">
                    <input type="hidden" name="id" value={entry.id} />
                    <s-button type="submit" tone="critical">
                      Delete
                    </s-button>
                  </Form>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
