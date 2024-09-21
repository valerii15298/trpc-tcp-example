import { z } from "zod";

export const schemaMessageTCP = z.object({
  id: z.string(),
  type: z.union([z.literal("query"), z.literal("mutation"), z.literal("subscription")]),
  path: z.string(),
});

export const schemaRequestMessageTCP = schemaMessageTCP.extend({
  input: z.unknown(),
});
export type RequestMessageTCP = z.infer<typeof schemaRequestMessageTCP>;

export const schemaResponseMessageTCP = schemaMessageTCP.extend({
  output: z.unknown(),
});
