import { z } from "zod";

// Minimal JSON-RPC envelope (we proxy to AVNU, so most fields are passthrough).
export const jsonRpcEnvelopeSchema = z.object({
  id: z.unknown().optional(),
  jsonrpc: z.unknown().optional(),
  method: z.enum(["paymaster_buildTransaction", "paymaster_executeTransaction"]),
  params: z
    .object({
      transaction: z.unknown(),
      parameters: z.unknown().optional(),
    })
    .passthrough(),
});

const invokeBaseSchema = z
  .object({
    user_address: z.unknown().optional(),
    userAddress: z.unknown().optional(),
    calls: z.unknown().optional(),
    typed_data: z.unknown().optional(),
    typedData: z.unknown().optional(),
    signature: z.unknown().optional(),
  })
  .passthrough();

const txDeploySchema = z
  .object({
    type: z.literal("deploy"),
    deployment: z.unknown().optional(),
  })
  .passthrough();

const txInvokeSchema = z
  .object({
    type: z.literal("invoke"),
    invoke: invokeBaseSchema.optional(),
  })
  .passthrough();

export const paymasterTransactionSchema = z.discriminatedUnion("type", [
  txDeploySchema,
  txInvokeSchema,
]);

export const paymasterRequestSchema = jsonRpcEnvelopeSchema.transform((req) => ({
  method: req.method,
  params: {
    transaction: paymasterTransactionSchema.parse(req.params.transaction),
    parameters: req.params.parameters,
  },
  raw: req,
}));

export type PaymasterRequest = z.infer<typeof paymasterRequestSchema>;

