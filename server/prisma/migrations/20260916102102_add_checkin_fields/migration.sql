-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NORMAL',
    "concernLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "response" TEXT,
    "extractedKeywords" TEXT,
    "notes" TEXT,
    "mood" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CheckIn" ("createdAt", "elderId", "id", "mood", "notes", "status", "timestamp") SELECT "createdAt", "elderId", "id", "mood", "notes", "status", "timestamp" FROM "CheckIn";
DROP TABLE "CheckIn";
ALTER TABLE "new_CheckIn" RENAME TO "CheckIn";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
