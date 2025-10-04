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
  const tokenBalance = connection.getTokenAccountBalance(userAta, "confirmed");
  console.log("Token balance : ", tokenBalance);

  // return tokenAccount details
  return tokenBalance;
};
