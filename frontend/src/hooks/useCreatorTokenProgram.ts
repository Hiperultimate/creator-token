import { AnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { getCreatorTokenProgram, getCreatorTokenProgramId } from "../../../anchor/creator-token-exports";
import { useQuery } from "@tanstack/react-query";
import { AnchorProvider } from "@coral-xyz/anchor";

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}

function useCreatorTokenProgram() {
  const { connection } = useConnection();
  const provider = useAnchorProvider();
  const programId = useMemo(() => getCreatorTokenProgramId("testnet"), []);
  const program = useMemo(
    () => getCreatorTokenProgram(provider, programId),
    [provider, programId]
  );

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account"],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  return {
    program,
    programId,
    getProgramAccount,
  };
}

export default useCreatorTokenProgram;