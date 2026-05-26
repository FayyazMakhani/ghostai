import { defineConfig } from "@trigger.dev/sdk"

const projectId = process.env.TRIGGER_PROJECT_ID
if (!projectId) throw new Error("TRIGGER_PROJECT_ID environment variable is required")

export default defineConfig({
  project: projectId,
  runtime: 'node',
  dirs: ["./trigger"],
  maxDuration: 3600,
})
