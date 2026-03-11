import db from "../db.server";

export const loader = async () => {
  const total = await db.preorderData.count();
  const byShop = await db.preorderData.groupBy({
    by: ["shop"],
    _count: true,
  });
  return Response.json({ total, byShop });
};
