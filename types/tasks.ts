import { z } from "zod"

export const aiStatusFeedPayloadSchema = z.object({
  text: z.string().optional(),
})

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>

export const chatMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
