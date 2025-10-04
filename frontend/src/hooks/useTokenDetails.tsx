import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { getCreatorTokenMint, getTokenPrice } from "@/lib/solana-helpers";
import { BN } from "@coral-xyz/anchor";

const useTokenDetails = (ownerAddress: PublicKey) => {
  const { connection } = useConnection();
  const { program, programId } = useCreatorTokenProgram();

  const { data, ...rest } = useQuery({
    queryKey: ["token-details", ownerAddress],
    queryFn: async () => {
      const [tokenDetails, oneTokenCost] = await Promise.all([
        getCreatorTokenMint({ mintOwnerAddress: ownerAddress, programId, connection }),
        getTokenPrice({
          program,
          creatorAddress: ownerAddress,
          tokensToBuy: new BN(1),
        }),
      ]);
        
      const solPrice = Number(oneTokenCost) / LAMPORTS_PER_SOL;
      return {
        tokenDetails: tokenDetails,
        currentTokenPrice: solPrice,
        tokenSupply:
          tokenDetails.supply / 10n ** BigInt(tokenDetails.decimals),
      };
    },
  });

  
  return {
    ...data,
    ...rest,
  };
};

export default useTokenDetails;