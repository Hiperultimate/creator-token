import { PublicKey } from "@solana/web3.js";
import useCreatorTokenProgram from "./useCreatorTokenProgram";
import { useMutation } from "@tanstack/react-query";
import { getUserIdentity } from "./useAnchor";
import { useConnection } from "@solana/wallet-adapter-react";

function useCreatorTokenProgramFns({ account }: { account: PublicKey }) {
  const { program } = useCreatorTokenProgram();
  const { connection } = useConnection();

  const createIdentityMutation = useMutation({
    mutationKey: ["create-identity"],
    mutationFn: ({
      userName,
      proofUrl,
    }: {
      userName: string;
      proofUrl: string;
    }) =>
      program.methods
        .createCreatorIdentity(userName, proofUrl)
        .accounts({
          creator: account,
        })
        .rpc(),
    onSuccess: () => {
      console.log("Perform promised success toast logic here");
      getUserIdentity(account, program, connection);
    },
    onError: () => {
      console.log("Perform promised error toast logic here");
    },
  });

  return {
    createIdentityMutation,
  };
}

export default useCreatorTokenProgramFns;
