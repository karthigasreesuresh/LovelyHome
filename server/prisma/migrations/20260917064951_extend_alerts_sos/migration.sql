-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'HEALTH_CONCERN',
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("createdAt", "elderId", "id", "message", "resolvedAt", "severity", "status", "title", "updatedAt") SELECT "createdAt", "elderId", "id", "message", "resolvedAt", "severity", "status", "title", "updatedAt" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE TABLE "new_SOS" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIGGERED',
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "locationUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SOS_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SOS" ("address", "createdAt", "elderId", "id", "latitude", "longitude", "resolvedAt", "status", "triggeredAt", "updatedAt") SELECT "address", "createdAt", "elderId", "id", "latitude", "longitude", "resolvedAt", "status", "triggeredAt", "updatedAt" FROM "SOS";
DROP TABLE "SOS";
ALTER TABLE "new_SOS" RENAME TO "SOS";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
