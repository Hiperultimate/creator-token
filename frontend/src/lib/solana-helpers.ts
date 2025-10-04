import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CreatorToken } from "../../../anchor/creator-token-exports";
import { BN } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export async function checkConfirmTransaction(
  connection: Connection,
  tx: string
) {
  const latestBlock = await connection.getLatestBlockhash();
  const transactionResult = await connection.confirmTransaction(
    {
      blockhash: latestBlock.blockhash,
      lastValidBlockHeight: latestBlock.lastValidBlockHeight,
      signature: tx,
    },
    "confirmed"
  );

  return transactionResult;
}

export const requestAirdrop = async (
  address: PublicKey,
  connection: Connection,
  amountInSol: number
) => {
  const solAmount = amountInSol * LAMPORTS_PER_SOL;
  const tx = await connection.requestAirdrop(address, solAmount);

  await checkConfirmTransaction(connection, tx);

  console.log(
    `Successfully given airdrop amount ${solAmount} to : ${address} `
  );
  console.log("Airdrop tx : ", tx);
};

export const checkUserBalance = async (
  address: PublicKey,
  connection: Connection
) => {
  const balance = await connection.getBalance(address, "confirmed");

  return balance / LAMPORTS_PER_SOL;
};

export const getUserIdentity = async (
  address: PublicKey,
  program: Program<CreatorToken>
) => {
  const [identityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), address.toBuffer()],
    program.programId
  );
  const userIdentity = await program.account.identity.fetch(identityPda);
  console.log("User identity : ", userIdentity);
  return userIdentity;
};

export const getCreatorTokenMint = async ({
  mintOwnerAddress,
  programId,
  connection,
}: {
  mintOwnerAddress: PublicKey;
  programId: PublicKey;
  connection: Connection;
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

export const getTokenPrice = async ({
  program,
  tokensToBuy,
  creatorAddress,
}: {
  program: Program<CreatorToken>;
  tokensToBuy: BN;
  creatorAddress: PublicKey;
}): Promise<bigint> => {
  const tokenCurrentPrice = await program.methods
    .getBuyingTokenPrice(tokensToBuy)
    .accounts({
      creator: creatorAddress,
    })
    .view();
  return tokenCurrentPrice;
};

export const getTokenBalanceOfUser = async ({
  connection,
  userAddress,
  tokenMint,
}: {
  connection: Connection;
  userAddress: PublicKey;
  tokenMint: PublicKey;
}) => {
  // get user ATA
  const userAta = await getAssociatedTokenAddress(
    tokenMint,
    userAddress,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // get tokenAccount
  const tokenBalance = await connection.getTokenAccountBalance(userAta, "confirmed");

  // return tokenAccount details
  return tokenBalance;
};

// Very expensive. Should swap to using Helius or any other indexer which keeps track of tokenHolderCount so we can simply rpc call it
export const getTokenHoldersCount = async ({
  connection,
  mintAddress,
  tokenProgram,
}: {
  connection: Connection;
  mintAddress: PublicKey;
  tokenProgram: PublicKey;
  }) => {
  // Get all token accounts for this mint
  const response = await connection.getProgramAccounts(tokenProgram, {
    filters: [
      { memcmp: { offset: 0, bytes: mintAddress.toBase58() } },
    ],
  });

  // Decode and filter non-zero balances
  const holders = response.filter((accountInfo) => {
    const balanceData = accountInfo.account.data;
    const amount = balanceData.readBigUInt64LE(64);
    return amount > 0n;
  });

  return holders.length;
}
