import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "./useAnchor";
import { useMemo } from "react";
import { getCreatorTokenProgram, getCreatorTokenProgramId } from "../../../anchor/creator-token-exports";
import { useQuery } from "@tanstack/react-query";

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