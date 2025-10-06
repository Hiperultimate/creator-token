import z from "zod";

export const checkWalletKey = z.object({ walletPublicKey: z.string() });
export const signInSchema = z.object({
  walletPublicKey: z.string(),
  nonce: z.string(),
  signedMessage: z.string(),
});
export const transactionAddSchema = z.object({
  tokenMint: z.string(),
  type: z.enum(["buy", "sell"]),
  amount: z.coerce.bigint(),
  walletAddress: z.string(),
});
