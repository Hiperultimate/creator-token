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
  isHoldingTokenZero: z.boolean(),
});

export const creatorAddSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  identityAddress: z.string(),
  userAddress: z.string(),
  tokenMintAddress: z.string(),
  basePrice: z.coerce.bigint(),
  slope: z.coerce.bigint(),
});

export const postCreateSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content must be less than 5000 characters"),
  tokenThreshold: z.coerce.bigint().nonnegative("Token threshold must be non-negative"),
});
