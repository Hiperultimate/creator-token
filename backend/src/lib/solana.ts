import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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

/**
 * Get the number of token holders for a given mint
 * Note: This is expensive - consider using an indexer like Helius in production
 */
export const getTokenHoldersCount = async (tokenMint: PublicKey): Promise<number> => {
  try {
    const response = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      filters: [{ memcmp: { offset: 0, bytes: tokenMint.toBase58() } }],
    });

    // Filter accounts with non-zero balances
    const holders = response.filter((accountInfo) => {
      const balanceData = accountInfo.account.data;
      const amount = balanceData.readBigUInt64LE(64);
      return amount > 0n;
    });

    return holders.length;
  } catch (error) {
    console.error("Error fetching token holders count:", error);
    return 0;
  }
};

/**
 * Calculate token price using bonding curve formula
 * price = basePrice + (slope * supply)
 */
export const calculateTokenPrice = ({
  basePrice,
  slope,
  supply,
  decimals,
}: {
  basePrice: bigint;
  slope: bigint;
  supply: bigint;
  decimals: number;
}): number => {
  // Convert supply from raw units to human-readable
  const supplyInUnits = supply / BigInt(10 ** decimals);
  
  // Calculate price in lamports: basePrice + (slope * supply)
  const priceInLamports = basePrice + (slope * supplyInUnits);
  
  // Convert to SOL
  return Number(priceInLamports) / LAMPORTS_PER_SOL;
};

