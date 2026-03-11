import { useLoaderData, Form, useSearchParams, useNavigation, useSubmit } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const PAGE_SIZE = 50;

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const search = url.searchParams.get("search") || "";

  const where = {
    shop: session.shop,
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { vendor: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, entries] = await Promise.all([
    db.preorderData.count({ where }),
    db.preorderData.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return { entries, total, page, search, pageSize: PAGE_SIZE };
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
  const { entries, total, page, search, pageSize } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit = useSubmit();
  const totalPages = Math.ceil(total / pageSize);
  const isLoading = navigation.state === "loading";

  function handleSearch(e) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params, { replace: true });
  }

  function goToPage(p) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  }

  return (
    <s-page heading="Preorder Notifications">
      {/* Summary bar */}
      <s-section>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <StatCard label="Total Entries" value={total} />
          <StatCard label="This Page" value={entries.length} />
          <StatCard label="Page" value={`${page} / ${totalPages || 1}`} />
        </div>
      </s-section>

      {/* Search + table */}
      <s-section heading="Entries">
        {/* Search */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="search"
            defaultValue={search}
            placeholder="Search by email, SKU, product or vendor…"
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #c9cccf",
              borderRadius: "8px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Table */}
        <div style={{ opacity: isLoading ? 0.5 : 1, transition: "opacity 0.2s" }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6d7175" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>📭</div>
              <div style={{ fontWeight: 600 }}>No entries found</div>
              {search && <div style={{ marginTop: "4px", fontSize: "13px" }}>Try a different search term</div>}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Email</Th>
                    <Th>Product</Th>
                    <Th>Vendor</Th>
                    <Th>SKU</Th>
                    <Th>Date</Th>
                    <Th style={{ width: 80 }}></Th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={entry.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <Td>
                        <span style={{ fontWeight: 500, color: "#202223" }}>{entry.email}</span>
                      </Td>
                      <Td>
                        <span style={{ color: "#202223" }}>{entry.title}</span>
                      </Td>
                      <Td>
                        <span style={badgeStyle}>{entry.vendor}</span>
                      </Td>
                      <Td>
                        <code style={{ fontSize: "12px", background: "#f1f1f1", padding: "2px 6px", borderRadius: "4px" }}>
                          {entry.sku}
                        </code>
                      </Td>
                      <Td style={{ color: "#6d7175", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </Td>
                      <Td>
                        <Form method="post">
                          <input type="hidden" name="id" value={entry.id} />
                          <button
                            type="submit"
                            style={deleteBtnStyle}
                            onMouseOver={e => e.currentTarget.style.background = "#ffd2d2"}
                            onMouseOut={e => e.currentTarget.style.background = "transparent"}
                          >
                            Delete
                          </button>
                        </Form>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
            <PagBtn disabled={page <= 1} onClick={() => goToPage(page - 1)}>← Prev</PagBtn>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <PagBtn key={p} active={p === page} onClick={() => goToPage(p)}>
                  {p}
                </PagBtn>
              );
            })}
            <PagBtn disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next →</PagBtn>
          </div>
        )}

        <div style={{ textAlign: "center", color: "#6d7175", fontSize: "13px", marginTop: "12px" }}>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} entries
        </div>
      </s-section>
    </s-page>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: "1 1 120px",
      background: "#f6f6f7",
      border: "1px solid #e1e3e5",
      borderRadius: "10px",
      padding: "16px 20px",
      minWidth: "120px",
    }}>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "#202223" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#6d7175", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function Th({ children, style }) {
  return (
    <th style={{ ...thStyle, ...style }}>{children}</th>
  );
}

function Td({ children, style }) {
  return (
    <td style={{ ...tdStyle, ...style }}>{children}</td>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        borderRadius: "6px",
        border: active ? "2px solid #008060" : "1px solid #c9cccf",
        background: active ? "#008060" : disabled ? "#f6f6f7" : "#fff",
        color: active ? "#fff" : disabled ? "#b5b9bd" : "#202223",
        fontWeight: active ? 700 : 400,
        fontSize: "13px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #e1e3e5",
};

const thStyle = {
  background: "#f6f6f7",
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "13px",
  color: "#6d7175",
  borderBottom: "1px solid #e1e3e5",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 14px",
  borderBottom: "1px solid #f1f1f1",
  verticalAlign: "middle",
};

const badgeStyle = {
  fontSize: "12px",
  background: "#e3f1df",
  color: "#1c6b3a",
  padding: "2px 8px",
  borderRadius: "20px",
  fontWeight: 500,
};

const deleteBtnStyle = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid #e1e3e5",
  background: "transparent",
  color: "#d72c0d",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
