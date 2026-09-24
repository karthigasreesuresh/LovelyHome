-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "scheduleTime" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'Daily',
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Medicine_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "ElderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Medicine" ("active", "createdAt", "dosage", "elderId", "frequency", "id", "instructions", "name", "scheduleTime", "updatedAt") SELECT "active", "createdAt", "dosage", "elderId", "frequency", "id", "instructions", "name", "scheduleTime", "updatedAt" FROM "Medicine";
DROP TABLE "Medicine";
ALTER TABLE "new_Medicine" RENAME TO "Medicine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
