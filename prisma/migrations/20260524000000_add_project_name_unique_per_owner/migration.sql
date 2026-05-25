-- Deduplicate: for each (ownerId, name) group keep only the most recent row
DELETE FROM "Project"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "ownerId", name
             ORDER BY "createdAt" DESC, "id" DESC
           ) AS rn
    FROM "Project"
  ) ranked
  WHERE rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_ownerId_name_key" ON "Project"("ownerId", "name");
