-- CreateTable
CREATE TABLE "PreorderData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
