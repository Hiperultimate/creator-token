import { PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";

const useTokenDetails = (ownerAddress : PublicKey) => {
    const { connection } = useConnection();
    const { programId } = useCreatorTokenProgram();

    const [identityProofPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("identity"), ownerAddress.toBuffer()],
        programId
    );

    const [mintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("owner"), identityProofPda.toBuffer()],
        programId
    );

    const mintDetails = useQuery({
        queryKey : ["get-mint", mintPda],
        queryFn: async () => getMint(connection, mintPda, "confirmed", TOKEN_2022_PROGRAM_ID)
    })

    return mintDetails;
}

export default useTokenDetails;