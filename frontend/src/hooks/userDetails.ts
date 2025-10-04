// Hook that will contain all queries/mutations related to the current logged in user.

import { getTokenBalanceOfUser } from "@/lib/solana-helpers";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

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
