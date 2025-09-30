import { useMemo } from 'react';
import { AnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor';
import { getCreatorTokenProgram, CREATOR_TOKEN_PROGRAM_ID, getCreatorTokenProgramId, type CreatorToken } from '../../../anchor/creator-token-exports';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
//  import type { Wallet } from '@coral-xyz/anchor';

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}

export function useAnchor() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // console.log("Checking net : ", connection.rpcEndpoint);
  checkUserBalance(wallet.publicKey, connection);

  const provider = useAnchorProvider();
  const programId = useMemo(() => getCreatorTokenProgramId("testnet"), []);


  const program = useMemo(() => {
    if (!provider) return null;

    try {
      setProvider(provider);
      return getCreatorTokenProgram(provider, programId);
    } catch (error) {
      console.warn("Failed to initialize Anchor program:", error);
      return null;
    }
  }, [provider, programId]);


  // TODO : Transfer these to useCreatorTokenProgramFns
  // Helper functions for common operations
  const createCreatorIdentity = async (userName: string, proofUrl: string) => {
    if (!program || !wallet.publicKey) throw new Error('Program or wallet not available');
    // TODO: Implement actual anchor method call
    console.log('Creating creator identity:', userName, proofUrl);

    const identityTx = await program.methods.createCreatorIdentity(userName, proofUrl).accounts({
      creator: wallet.publicKey
    }).rpc();
    console.log("Checking return type : ", identityTx);

    const identity = getUserIdentity(wallet.publicKey, program, connection);

    return identityTx;
  };

  const createCreatorToken = async (decimals: number, basePrice: number, slope: number) => {
    if (!program || !wallet.publicKey) throw new Error('Program or wallet not available');
    // TODO: Implement actual anchor method call
    console.log('Creating creator token:', decimals, basePrice, slope);

    // return await program.methods.createCreatorToken(decimals, basePrice, slope).rpc();
  };

  const buyToken = async (tokensToBuy: number) => {
    if (!program || !wallet.publicKey) throw new Error('Program or wallet not available');

    // TODO: Implement actual anchor method call
    console.log('Buying tokens:', tokensToBuy);

    // return await program.methods.buyCreatorToken(tokensToBuy).rpc();
  };

  const sellToken = async (tokensToSell: number) => {
    if (!program || !wallet.publicKey) throw new Error('Program or wallet not available');

    // TODO: Implement actual anchor method call
    console.log('Selling tokens:', tokensToSell);

    // return await program.methods.sellCreatorToken(tokensToSell).rpc();
  };

  const getBuyingCost = async (tokensToBuy: number): Promise<number> => {
    if (!program) throw new Error("Program not available");

    // TODO: Implement actual anchor method call
    console.log("Getting buying cost for:", tokensToBuy);

    // const result = await program.methods.getBuyingTokenPrice(tokensToBuy).view();
    // return result.toNumber();
    return tokensToBuy * 0.1; // Placeholder
  };

  const getSellingReturn = async (tokensToSell: number): Promise<number> => {
    if (!program) throw new Error("Program not available");

    // TODO: Implement actual anchor method call
    console.log("Getting selling return for:", tokensToSell);

    // const result = await program.methods.getSellingReturnPrice(tokensToSell).view();
    // return result.toNumber();
    return tokensToSell * 0.9; // Placeholder
  };

  return {
    program,
    provider,
    createCreatorIdentity,
    createCreatorToken,
    buyToken,
    sellToken,
    getBuyingCost,
    getSellingReturn,
  };
}

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

export const requestAirdrop = async (address: PublicKey, connection: Connection, amountInSol : number) => {
  const solAmount = amountInSol * LAMPORTS_PER_SOL;
  const tx = await connection.requestAirdrop(address, solAmount);

  await checkConfirmTransaction(connection, tx);

  console.log(`Successfully given airdrop amount ${solAmount} to : ${address} `);
  console.log("Airdrop tx : ", tx);
}

export const checkUserBalance = async (address: PublicKey, connection : Connection) => { 
  const balance = await connection.getBalance(address, 'confirmed');

  return balance / LAMPORTS_PER_SOL; 
}


export const getUserIdentity = async (address: PublicKey, program: Program<CreatorToken>, connection: Connection) => { 
  const [identityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), address.toBuffer()],
    program.programId
  );
  const userIdentity = await program.account.identity.fetch(identityPda);
  console.log("Identity stored on blockchain : ", userIdentity);
  return userIdentity;
}