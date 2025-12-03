import { useState, useCallback } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useQueryClient } from "@tanstack/react-query";
import useCreatorTokenProgramFns from "./useCreatorTokenProgramFns";

interface TokenDetails {
  address: PublicKey;
  decimals: number;
}

interface UseTokenTradingOptions {
  userAddress: PublicKey | null;
  creatorAddress: PublicKey;
  tokenDetails: TokenDetails | undefined;
  isAuthenticated: boolean;
  initialBalance?: number;
}

interface UseTokenTradingReturn {
  // Buy state
  buyAmount: string;
  setBuyAmount: (amount: string) => void;
  buyingCost: bigint | undefined;
  isBuyingCostLoading: boolean;
  handleBuyTokens: () => Promise<void>;
  isBuying: boolean;

  // Sell state
  sellAmount: string;
  setSellAmount: (amount: string) => void;
  sellingReturn: BN | undefined;
  isSellingCostLoading: boolean;
  handleSellTokens: () => Promise<void>;
  isSelling: boolean;

  // Balance
  userBalance: number;
  setUserBalance: (balance: number) => void;
}

export function useTokenTrading({
  userAddress,
  creatorAddress,
  tokenDetails,
  isAuthenticated,
  initialBalance = 0,
}: UseTokenTradingOptions): UseTokenTradingReturn {
  const queryClient = useQueryClient();
  const {
    buyTokenMutation,
    sellTokenMutation,
    useBuyingCostQuery,
    useSellingReturnQuery,
  } = useCreatorTokenProgramFns({
    account: userAddress,
  });

  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [userBalance, setUserBalance] = useState(initialBalance);

  // Buying cost query
  const { data: buyingCost, isLoading: isBuyingCostLoading } =
    useBuyingCostQuery(
      !isNaN(Number(buyAmount)) ? new BN(Number(buyAmount)) : new BN(0),
      creatorAddress
    );

  // Selling return query
  const { data: sellingReturn, isLoading: isSellingCostLoading } =
    useSellingReturnQuery(
      !isNaN(Number(sellAmount)) ? new BN(Number(sellAmount)) : new BN(0),
      creatorAddress
    );

  const handleBuyTokens = useCallback(async () => {
    if (!buyAmount || !isAuthenticated || !tokenDetails) return;

    try {
      const tx = await buyTokenMutation.mutateAsync({
        buyTokenAmount: new BN(Number(buyAmount)),
        creatorAddress,
        tokenDecimal: tokenDetails.decimals,
        tokenMint: tokenDetails.address,
      });
      queryClient.invalidateQueries({ queryKey: ["token-details"] });
      console.log("User bought token:", tx);
      setUserBalance((prev) => prev + Number(buyAmount));
      setBuyAmount("");
    } catch (error) {
      console.error("Error buying tokens:", error);
      throw error;
    }
  }, [
    buyAmount,
    isAuthenticated,
    tokenDetails,
    buyTokenMutation,
    creatorAddress,
    queryClient,
  ]);

  const handleSellTokens = useCallback(async () => {
    if (!sellAmount || !isAuthenticated || !tokenDetails) return;

    try {
      await sellTokenMutation.mutateAsync({
        sellTokenAmount: new BN(Number(sellAmount)),
        creatorAddress,
        tokenDecimal: tokenDetails.decimals,
      });
      queryClient.invalidateQueries({ queryKey: ["token-details"] });
      setUserBalance((prev) => prev - Number(sellAmount));
      setSellAmount("");
    } catch (error) {
      console.error("Error selling tokens:", error);
      throw error;
    }
  }, [
    sellAmount,
    isAuthenticated,
    tokenDetails,
    sellTokenMutation,
    creatorAddress,
    queryClient,
  ]);

  return {
    // Buy state
    buyAmount,
    setBuyAmount,
    buyingCost,
    isBuyingCostLoading,
    handleBuyTokens,
    isBuying: buyTokenMutation.isPending,

    // Sell state
    sellAmount,
    setSellAmount,
    sellingReturn,
    isSellingCostLoading,
    handleSellTokens,
    isSelling: sellTokenMutation.isPending,

    // Balance
    userBalance,
    setUserBalance,
  };
}

// Helper to format cost/return for display
export function formatSolAmount(amount: BN | bigint | undefined): string {
  if (!amount) return "0";
  const value = typeof amount === "bigint" ? Number(amount) : amount.toNumber();
  return (value / LAMPORTS_PER_SOL).toFixed(4);
}

