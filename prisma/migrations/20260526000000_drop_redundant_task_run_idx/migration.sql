-- Drop redundant plain index on runId; the unique constraint (TaskRun_runId_key) already covers lookups on this column.
DROP INDEX IF EXISTS "TaskRun_runId_idx";
