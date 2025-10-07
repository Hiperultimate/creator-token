import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import {
  getCreatorTokenMint,
  getTokenHoldersCount,
  getTokenPrice,
  getTokenBalanceOfUser,
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
            tokenOwnerAddress,
          }: {
            tokenMint: string;
            tokenOwnerAddress: string;
          }) => {
            try {
              const [balance, price] = await Promise.all([
                getTokenBalanceOfUser({
                  connection,
                  userAddress: account,
                  tokenMint: new PublicKey(tokenMint),
                }),
                getTokenPrice({
                  program,
                  tokensToBuy: new BN(1),
                  creatorAddress: new PublicKey(tokenOwnerAddress),
                }),
              ]);

              // Needs rework. Does not work
              const tokenValue =
                (Number(price) / LAMPORTS_PER_SOL) * balance.value.uiAmount;
              totalPortfolioValue += tokenValue;

              return {
                mint: tokenMint,
                amount: balance.value.amount,
                decimals: balance.value.decimals,
              };
            } catch (error) {
              console.log("Error occured while fetching user token details :", error);
            }
          }
        )
      );

      return {
        tokenDetails,
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