import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export function verifySignature({
  message,
  signature, // base58
  walletAddress, // base58
}: {
  message: string;
  signature: string;
  walletAddress: string;
}) {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = new PublicKey(walletAddress).toBytes();

  const verified = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
  return verified;
}
