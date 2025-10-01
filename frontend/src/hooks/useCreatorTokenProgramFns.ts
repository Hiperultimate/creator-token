import { PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserIdentity } from "@/lib/solana-helpers";
import { type BN } from "@coral-xyz/anchor";

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
    mutationFn: ({
      decimals,
      basePriceInLamports,
      slopeInLamports,
    }: {
      decimals: number;
      basePriceInLamports: BN;
      slopeInLamports: BN;
    }) => {
      // return program.methods.createCreatorToken(decimals, basePrice, slope).rpc();
      console.log(
        "Creating token for with these details : ",
        decimals,
        basePriceInLamports,
        slopeInLamports
      );
      return null;
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
    mutationFn: ({ buyTokenAmount }: { buyTokenAmount: number }) => {
      // return await program.methods.buyCreatorToken(tokensToBuy).rpc();
      return null;
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
    mutationFn: ({ sellTokenAmount } : {sellTokenAmount : number}) => {
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

  const useBuyingCostQuery = (tokensToBuy: number) => {
    // debounce input before querying
    // const debouncedTokens = useDebounce(tokensToBuy, 500);
    return useQuery({
      queryKey: ["get-buying-cost", tokensToBuy],
      queryFn: async () => {
        // return await program.methods.sellCreatorToken(tokensToBuy).rpc();
        return tokensToBuy * 0.1;
      },
      enabled: tokensToBuy > 0, // only run when input is > 0
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
