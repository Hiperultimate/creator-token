import { PublicKey } from "@solana/web3.js";

// Simplified type definitions for the creator token program
export interface CreatorIdentity {
  creator: PublicKey;
  creatorName: string;
  proofUrl: string;
}

export interface CreatorToken {
  creator: PublicKey;
  mint: PublicKey;
  basePrice: number;
  slope: number;
  supply: number;
}

export interface TokenBalance {
  mint: PublicKey;
  amount: number;
  decimals: number;
}

export interface Creator {
  pubkey: PublicKey;
  identity: CreatorIdentity;
  token?: CreatorToken;
  currentPrice?: number;
  totalSupply?: number;
  holdersCount?: number;
}

export interface Post {
  id: string;
  creatorId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  requiredTokens: number;
  createdAt: Date;
  type: 'text' | 'image' | 'video';
}

export interface UserProfile {
  walletAddress: string;
  name?: string;
  profileImage?: string;
  isCreator: boolean;
  creatorId?: string;
}

// Anchor program methods interface
export interface AnchorProgram {
  methods: {
    createCreatorIdentity: (userName: string, proofUrl: string) => any;
    createCreatorToken: (decimals: number, basePrice: number, slope: number) => any;
    buyToken: (tokensToBuy: number) => any;
    sellToken: (tokensToSell: number) => any;
    buyingCost: (tokensToBuy: number) => any;
    sellingReturn: (tokensToSell: number) => any;
  };
}