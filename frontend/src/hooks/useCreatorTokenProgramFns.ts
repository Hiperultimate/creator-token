import { PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserIdentity } from "@/lib/solana-helpers";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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
      getUserIdentity(account, program);
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
      return (
        program.methods
          .createCreatorToken(decimals, basePriceInLamports, slopeInLamports)
          .accounts({
            creator: account,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          // .signers([creator])
          .rpc()
      );
      // return null;
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
      tokenDecimal
    }: {
      buyTokenAmount: BN;
      creatorAddress: PublicKey;
      tokenDecimal: number
    }) => {
      const tokenDecimalBN = new BN(tokenDecimal);
      const buyTokenDecimals = buyTokenAmount.mul(new BN(10).pow(tokenDecimalBN));
      return program.methods
        .buyCreatorToken(buyTokenDecimals)
        .accounts({
          buyer: account,
          creator: creatorAddress,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      // return null;
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
    mutationFn: ({ sellTokenAmount }: { sellTokenAmount: number }) => {
      // return await program.methods.sellCreatorToken(tokensToBuy).rpc();
      return null;
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
      queryFn: async () => {
        const tokenCurrentPrice = await program.methods
          .getBuyingTokenPrice(tokensToBuy)
          .accounts({
            creator: creatorAddress,
          })
          .view();
        console.log("Fetched token price :", tokenCurrentPrice);
        return tokenCurrentPrice;
        // return tokensToBuy * 0.1;
      },
      enabled: tokensToBuy.gt(new BN(0)), // only run when input is > 0
    });
  };

  const useSellingReturnQuery = (tokensToSell: number) =>
    useQuery({
      queryKey: ["get-selling-cost", tokensToSell],
      queryFn: async () => {
        // const result = await program.methods.getSellingReturnPrice(tokensToSell).view();

        return tokensToSell * 0.9; // Placeholder
      },
      enabled: tokensToSell > 0,
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
