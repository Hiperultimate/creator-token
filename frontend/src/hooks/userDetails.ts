// Hook that will contain all queries/mutations related to the current logged in user.

import { getCreatorTokenMint, getTokenBalanceOfUser, getUserIdentity } from "@/lib/solana-helpers";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import useCreatorTokenProgram from "./useCreatorTokenProgram";

// Think about how to get token mint here, by calling getCreatorTokenMint or getting it from props
export const useGetTokenBalance = ({ tokenMint }: { tokenMint: PublicKey }) => {
  const { connection } = useConnection();
  const currentUserWallet = useWallet();

  const tokenBalance = useQuery({
    queryKey: ["token-balance", tokenMint, currentUserWallet.publicKey],
    queryFn: async () =>
      getTokenBalanceOfUser({
        connection,
        userAddress: currentUserWallet.publicKey,
        tokenMint,
      }),
    enabled: !!tokenMint,
  });

  return tokenBalance;
};

export const useGetUserTokenIdentity = (account: PublicKey) => {
  const { program } = useCreatorTokenProgram();

  return useQuery({
    queryKey: ["user-identity", account],
    queryFn: async () => {
      try {
        const identity = await getUserIdentity(account, program);
        return identity;
      } catch (error) {
        return null;
      }
    },
    enabled: !!account,
  });
};

export const useGetUserCreatorToken = (account: PublicKey) => {
  const { connection } = useConnection();
  const { programId } = useCreatorTokenProgram();

  return useQuery({
    queryKey: ["user-creator-token", account],
    queryFn: async () => {
      try {
        const creatorToken = await getCreatorTokenMint({
          mintOwnerAddress: account,
          programId,
          connection,
        });
        return creatorToken;
      } catch (error) {
        return null;
      }
    },
    enabled: !!account,
  });
};
