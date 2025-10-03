import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";
import { getTokenPrice } from "@/lib/solana-helpers";
import { BN } from "@coral-xyz/anchor";

const useTokenDetails = (ownerAddress: PublicKey) => {
  const { connection } = useConnection();
  const { program, programId } = useCreatorTokenProgram();

  const [identityProofPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), ownerAddress.toBuffer()],
    programId
  );

  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("owner"), identityProofPda.toBuffer()],
    programId
  );

  const { data, ...rest } = useQuery({
    queryKey: ["token-details", mintPda, ownerAddress],
    queryFn: async () => {
      const [tokenDetails, oneTokenCost] = await Promise.all([
        getMint(connection, mintPda, "confirmed", TOKEN_2022_PROGRAM_ID),
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