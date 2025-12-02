import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import {
  getCreatorTokenMint,
  getTokenHoldersCount,
  getTokenPrice,
  getTokenBalanceOfUser,
  getTokenSellPrice,
  getSOLPriceUSDT,
} from "@/lib/solana-helpers";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";

const useTokenDetails = (ownerAddress: PublicKey) => {
  const { connection } = useConnection();
  const { program, programId } = useCreatorTokenProgram();

  const { data, ...rest } = useQuery({
    queryKey: ["token-details", ownerAddress],
    queryFn: async () => {
      const [tokenDetails, oneTokenCost] = await Promise.all([
        getCreatorTokenMint({
          mintOwnerAddress: ownerAddress,
          programId,
          connection,
        }),
        getTokenPrice({
          program,
          creatorAddress: ownerAddress,
          tokensToBuy: new BN(1),
        }),
      ]);

      const tokenHolderCount = await getTokenHoldersCount({
        connection,
        mintAddress: tokenDetails.address,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      });

      const solPrice = Number(oneTokenCost) / LAMPORTS_PER_SOL;
      return {
        tokenDetails: tokenDetails,
        currentTokenPrice: solPrice,
        tokenHolderCount,
        tokenSupply: tokenDetails.supply / 10n ** BigInt(tokenDetails.decimals),
      };
    },
  });

  return {
    ...data,
    ...rest,
  };
};

const useGetUserTokenDetails = (account: PublicKey) => {
  const { connection } = useConnection();
  const { program } = useCreatorTokenProgram();

  const { data, ...rest } = useQuery({
    queryKey: ["user-token-details", account],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/transaction/user-stats`,
        { withCredentials: true }
      );

      const { ownedTokens, totalOperations } = response.data;

      let totalPortfolioValue = 0;

      const tokenDetails = await Promise.all(
        ownedTokens.map(
          async ({
            tokenMint,
            creatorWallet,
            creatorName,
          }: {
            tokenMint: string;
            creatorWallet: string;
            creatorName: string;
          }) => {
            try {
              const balance = await getTokenBalanceOfUser({
                connection,
                userAddress: account,
                tokenMint: new PublicKey(tokenMint),
              });

              // Skip if balance is 0
              if (balance.value.uiAmount === 0) {
                return null;
              }

              const price = await getTokenSellPrice({
                program,
                tokensToSell: new BN(balance.value.uiAmount),
                creatorAddress: new PublicKey(creatorWallet),
              });

              const DOLLAR_PER_SOL = await getSOLPriceUSDT();
              const tokenValue = Number(price) / LAMPORTS_PER_SOL;
              const tokenValueInDollars = tokenValue * DOLLAR_PER_SOL

              totalPortfolioValue += tokenValueInDollars;

              return {
                mint: tokenMint,
                amount: balance.value.amount,
                decimals: balance.value.decimals,
                creatorName,
                creatorWallet
              };
            } catch (error) {
              console.log(
                "Error occured while fetching user token details :",
                error
              );
              return null;
            }
          }
        )
      );

      // Filter out failed token fetches (null/undefined)
      const validTokenDetails = tokenDetails.filter(
        (token): token is NonNullable<typeof token> => token !== null && token !== undefined
      );

      return {
        tokenDetails: validTokenDetails,
        totalTransactions: totalOperations,
        totalPortfolioValue,
      };
    },
    enabled: !!account,
  });

  return {
    data,
    ...rest,
  };
};

export default useTokenDetails;
export { useGetUserTokenDetails };
