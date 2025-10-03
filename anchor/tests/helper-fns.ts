import * as anchor from "@coral-xyz/anchor";
import { CreatorToken } from "../target/types/creator_token";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function checkConfirmTransaction(
  provider: anchor.Provider,
  tx: string
) {
  const latestBlock = await provider.connection.getLatestBlockhash();
  const transactionResult = await provider.connection.confirmTransaction(
    {
      blockhash: latestBlock.blockhash,
      lastValidBlockHeight: latestBlock.lastValidBlockHeight,
      signature: tx,
    },
    "confirmed"
  );

  return transactionResult;
}

export async function airDropSOLAmount(
  provider: anchor.Provider,
  receiverPublicKey: anchor.web3.PublicKey,
  amountInSol: number
) {
  const airdropTx = await provider.connection.requestAirdrop(
    receiverPublicKey,
    amountInSol * anchor.web3.LAMPORTS_PER_SOL
  );

  await checkConfirmTransaction(provider, airdropTx);
  return airdropTx;
}

export async function buyCreatorToken({
  provider,
  program,
  decimals,
  signer,
  tokenCreator,
  tokenToMintWholeNumber,
}: {
  provider: anchor.Provider;
  program: anchor.Program<CreatorToken>;
  decimals: number;
  signer: anchor.web3.Keypair;
  tokenCreator: anchor.web3.PublicKey;
  tokenToMintWholeNumber: number;
}) {
  const amtOfTokens = tokenToMintWholeNumber;
  const tokenToBuy = new anchor.BN(amtOfTokens).mul(
    new anchor.BN(10).pow(new anchor.BN(decimals))
  );

  const buyCreatorTokenTx = await program.methods
    .buyCreatorToken(tokenToBuy)
    .accounts({
      buyer: signer.publicKey,
      creator: tokenCreator,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([signer])
    .rpc();

  await checkConfirmTransaction(provider, buyCreatorTokenTx);

  return { buyCreatorTokenTx, tokenBought: tokenToBuy };
}

export async function getSellingPriceForToken(
  program: anchor.Program<CreatorToken>,
  amtOfTokens: number,
  decimals: number,
  tokenCreator: anchor.web3.PublicKey
) {
  const lamportsNeeded = await program.methods
    .getSellingReturnPrice(new anchor.BN(amtOfTokens))
    .accounts({
      creator: tokenCreator,
    })
    .view();

  return lamportsNeeded;
}

export async function getBuyingPriceForToken(
  program: anchor.Program<CreatorToken>,
  amtOfTokens: number,
  decimals: number,
  tokenCreator: anchor.web3.PublicKey
) {
  const lamportsNeeded = await program.methods
    .getBuyingTokenPrice(new anchor.BN(amtOfTokens))
    .accounts({
      creator: tokenCreator,
    })
    .view();

  return lamportsNeeded;
}

export async function getUserTokenBalance(
  provider: anchor.Provider,
  mintAddress: anchor.web3.PublicKey,
  userAddress: anchor.web3.PublicKey
) {
  const ata = await getAssociatedTokenAddress(
    mintAddress,
    userAddress,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const balance = await provider.connection.getTokenAccountBalance(
    ata,
    "confirmed"
  );

  return balance.value;
}
