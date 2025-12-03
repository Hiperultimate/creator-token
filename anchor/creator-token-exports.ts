// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import CreatorTokenIDL from './target/idl/creator_token.json'
import type { CreatorToken } from './target/types/creator_token'

// Re-export the generated IDL and type
export { CreatorToken, CreatorTokenIDL }

// The programId is imported from the program IDL.
export const CREATOR_TOKEN_PROGRAM_ID = new PublicKey(CreatorTokenIDL.address)

// This is a helper function to get the CreatorToken Anchor program.
export function getCreatorTokenProgram(provider: AnchorProvider, address?: PublicKey): Program<CreatorToken> {
  return new Program({ ...CreatorTokenIDL, address: address ? address.toBase58() : CreatorTokenIDL.address } as CreatorToken, provider)
}

// This is a helper function to get the program ID for the CreatorToken program depending on the cluster.
export function getCreatorTokenProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the CreatorToken program on devnet and testnet.
      return new PublicKey('EEiGYjpth5GS6fNvX2a2ZbQV7gCNAZjMRE3XMtBrFbfq') // Update with actual devnet/testnet address if deployed
    case 'mainnet-beta':
    default:
      return CREATOR_TOKEN_PROGRAM_ID
  }
}