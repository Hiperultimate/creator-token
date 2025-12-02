import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { Mint } from "@solana/spl-token";

// Initialize connection (use env var for RPC URL)
export const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  "confirmed"
);

export const getCreatorTokenMint = async ({
  mintOwnerAddress,
  programId,
}: {
  mintOwnerAddress: PublicKey;
  programId: PublicKey;
}) => {
  const [identityProofPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), mintOwnerAddress.toBuffer()],
    programId
  );

  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("owner"), identityProofPda.toBuffer()],
    programId
  );

  return await getMint(connection, mintPda, "confirmed", TOKEN_2022_PROGRAM_ID);
};

export const getTokenMintInfo = async (tokenMint: PublicKey): Promise<Mint> => {
  return await getMint(connection, tokenMint, "confirmed", TOKEN_2022_PROGRAM_ID);
};

export const getTokenBalanceOfUser = async ({
  userAddress,
  tokenMint,
}: {
  userAddress: PublicKey;
  tokenMint: PublicKey;
}): Promise<{ balance: bigint; decimals: number }> => {
  try {
    // Get mint info for decimals
    const mintInfo = await getTokenMintInfo(tokenMint);
    
    const userAta = await getAssociatedTokenAddress(
      tokenMint,
      userAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Fetching balance for ATA:", userAta.toBase58());
    console.log("RPC URL:", process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com (default)");

    const tokenBalance = await connection.getTokenAccountBalance(
      userAta,
      "confirmed"
    );

    console.log("Token balance response:", tokenBalance.value);

    return {
      balance: BigInt(tokenBalance.value.amount),
      decimals: mintInfo.decimals,
    };
  } catch (error) {
    console.log("Error fetching balance (ATA might not exist):", error);
    // If ATA doesn't exist, user has 0 balance
    return { balance: BigInt(0), decimals: 6 }; // Default to 6 decimals
  }
};

