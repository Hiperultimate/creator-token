import z from "zod";

export const checkWalletKey = z.object({ walletPublicKey: z.string() });
export const signInSchema = z.object({ walletPublicKey: z.string(), nonce : z.string(), signedMessage: z.string() });
