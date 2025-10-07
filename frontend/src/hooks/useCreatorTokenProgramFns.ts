import { PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getTokenPrice,
  getTokenBalanceOfUser,
  getCreatorTokenMint,
} from "@/lib/solana-helpers";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";

function useCreatorTokenProgramFns({ account }: { account: PublicKey }) {
  const { program } = useCreatorTokenProgram();

  const createIdentityMutation = useMutation({
    mutationKey: ["create-identity"],
    mutationFn: ({
      userName,
      proofUrl,
    }: {
      userName: string;
      proofUrl: string;
    }) =>
      program.methods
        .createCreatorIdentity(userName, proofUrl)
        .accounts({
          creator: account,
        })
        .rpc(),
    onSuccess: () => {
      console.log("Perform promised success toast logic here");
    },
    onError: () => {
      console.log("Perform promised error toast logic here");
    },
  });

  const createCreatorTokenMutation = useMutation({
    mutationKey: ["create-creator-token"],
    mutationFn: async ({
      decimals,
      basePriceInLamports,
      slopeInLamports,
    }: {
      decimals: number;
      basePriceInLamports: BN;
      slopeInLamports: BN;
    }) => {
      const createTokenResponse = await program.methods
        .createCreatorToken(decimals, basePriceInLamports, slopeInLamports)
        .accounts({
          creator: account,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const [identityAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("identity"), account.toBuffer()],
        program.programId
      );
      const userIdentity = await program.account.identity.fetch(
        identityAddress
      );
      const mintInfo = await getCreatorTokenMint({
        mintOwnerAddress: account,
        programId: program.programId,
        connection: program.provider.connection,
      });

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/creator/add`,
        {
          displayName: userIdentity.creatorName,
          bio: localStorage.getItem("bio") || "",
          identityAddress: identityAddress.toBase58(),
          userAddress: account.toBase58(),
          tokenMintAddress: mintInfo.address.toBase58(),
          basePrice: basePriceInLamports.toString(),
          slope: slopeInLamports.toString(),
        },
        { withCredentials: true }
      );

      return createTokenResponse;
    },
    onSuccess: () => {
      console.log("Creator token created successfully");
    },
    onError: () => {
      console.log("Something went wrong while creating creator token");
    },
  });

  const buyTokenMutation = useMutation({
    mutationKey: ["buy-creator-token"],
    mutationFn: async ({
      buyTokenAmount,
      creatorAddress,
      tokenDecimal,
      tokenMint
    }: {
      buyTokenAmount: BN;
      creatorAddress: PublicKey;
      tokenDecimal: number;
      tokenMint: PublicKey
    }) => {
      const tokenDecimalBN = new BN(tokenDecimal);
      const buyTokenDecimals = buyTokenAmount.mul(
        new BN(10).pow(tokenDecimalBN)
      );
      const buyTokenResponse = await program.methods
        .buyCreatorToken(buyTokenDecimals)
        .accounts({
          buyer: account,
          creator: creatorAddress,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const balance = await getTokenBalanceOfUser({
        connection: program.provider.connection,
        userAddress: account,
        tokenMint: creatorAddress,
      });
      const isHoldingTokenZero = balance.value.uiAmount === 0;

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/transaction/add`,
        {
          tokenMint: tokenMint.toBase58(),
          type: "buy",
          amount: buyTokenDecimals.toString(),
          walletAddress: account.toBase58(),
          isHoldingTokenZero,
        },
        { withCredentials: true }
      );

      return buyTokenResponse;
    },
    onSuccess: () => {
      console.log("Successfully bought creator token");
    },
    onError: () => {
      console.log("An error occured while buying creator token");
    },
  });

  const sellTokenMutation = useMutation({
    mutationKey: ["sell-creator-token"],
    mutationFn: async ({
      sellTokenAmount,
      creatorAddress,
      tokenDecimal,
    }: {
      sellTokenAmount: BN;
      creatorAddress: PublicKey;
      tokenDecimal: number;
    }) => {
      const tokenDecimalBN = new BN(tokenDecimal);
      const buyTokenDecimals = sellTokenAmount.mul(
        new BN(10).pow(tokenDecimalBN)
      );
      const sellTokenResponse = await program.methods
        .sellCreatorToken(buyTokenDecimals)
        .accounts({
          seller: account,
          creator: creatorAddress,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const balance = await getTokenBalanceOfUser({
        connection: program.provider.connection,
        userAddress: account,
        tokenMint: creatorAddress,
      });
      const isHoldingTokenZero = balance.value.uiAmount === 0;

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/transaction/add`,
        {
          tokenMint: creatorAddress.toBase58(),
          type: "sell",
          amount: buyTokenDecimals.toString(),
          walletAddress: account.toBase58(),
          isHoldingTokenZero,
        },
        { withCredentials: true }
      );

      return sellTokenResponse;
    },
    onSuccess: () => {
      console.log("Successfully sold creator token");
    },
    onError: () => {
      console.log("An error occured while selling creator token");
    },
  });

  const useBuyingCostQuery = (tokensToBuy: BN, creatorAddress: PublicKey) => {
    // debounce input before querying
    // const debouncedTokens = useDebounce(tokensToBuy, 500);
    return useQuery({
      queryKey: ["get-buying-cost", tokensToBuy, creatorAddress],
      queryFn: async () =>
        getTokenPrice({ program, creatorAddress, tokensToBuy }),
      enabled: tokensToBuy.gt(new BN(0)), // only run when input is > 0
    });
  };

  const useSellingReturnQuery = (tokensToSell: BN, creatorAddress: PublicKey) =>
    useQuery({
      queryKey: ["get-selling-cost", tokensToSell, creatorAddress],
      queryFn: async () => {
        return program.methods
          .getSellingReturnPrice(tokensToSell)
          .accounts({
            creator: creatorAddress,
          })
          .view();
      },
      enabled: tokensToSell.gt(new BN(0)),
    });

  return {
    createIdentityMutation,
    createCreatorTokenMutation,
    buyTokenMutation,
    sellTokenMutation,
    useBuyingCostQuery,
    useSellingReturnQuery,
  };
}

export default useCreatorTokenProgramFns;
