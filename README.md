# CreatorToken

A decentralized platform that revolutionizes creator-fan relationships through tokenized support. Instead of traditional donations where fans receive nothing tangible in return, CreatorToken enables fans to invest in their favorite creators, aligning incentives and creating a sustainable ecosystem for content creators and their communities.

## The Problem

Traditional creator support models are fundamentally broken:

- **Donations are one-sided**: Fans give money and receive nothing of lasting value
- **Platform dependency**: Creators are at the mercy of centralized platforms that can change monetization rules at any time
- **No upside for early supporters**: Fans who discover and support creators early receive no benefit when those creators succeed
- **Limited funding options**: Creators struggle to raise capital for projects without giving up equity or creative control

## The Solution

CreatorToken introduces a tokenized support model built on Solana:

- **Creators mint personal tokens** with an Automated Market Maker (AMM) that dynamically prices tokens based on supply and demand
- **Fans invest rather than donate**: When you buy a creator's token, you're betting on their growth. If the creator succeeds and demand increases, your tokens appreciate in value
- **Creators can raise funding** by selling their own tokens, giving them capital without sacrificing ownership or creative freedom
- **Token-gated content**: Creators can offer exclusive content to token holders, creating additional utility and demand

### How the AMM Works

The platform uses a bonding curve pricing model where:

- Token price increases as more tokens are purchased (supply increases)
- Token price decreases as tokens are sold (supply decreases)
- This creates organic price discovery based on genuine demand
- Early supporters benefit from lower entry prices

## Architecture

```
creator-token/
├── anchor/          # Solana smart contracts (Rust)
├── backend/         # Express.js API server
└── frontend/        # React application
```

### Anchor (Smart Contracts)

The on-chain program handles all trustless operations:

- **Creator Identity**: On-chain verification of creator accounts
- **Token Minting**: SPL Token 2022 standard with creator-controlled parameters
- **AMM Logic**: Bonding curve implementation for dynamic pricing
- **Buy/Sell Operations**: Atomic token swaps with price calculation

Key files:
- `programs/creator-token/src/instructions/` - All program instructions
- `programs/creator-token/src/state/` - On-chain account structures
- `programs/creator-token/src/helpers/` - Utility functions including price calculations

### Backend

Express.js server providing:

- **Authentication**: Wallet-based authentication using signed messages
- **Creator Management**: Profile creation and content posting
- **Transaction Tracking**: Off-chain indexing of buy/sell operations
- **Content Delivery**: Token-gated content access verification

Key directories:
- `routers/` - API route handlers
- `prisma/` - Database schema and migrations
- `middleware/` - Authentication and request validation
- `src/lib/` - Shared utilities including Solana RPC helpers

### Frontend

React application with:

- **Wallet Integration**: Phantom, Solflare, and Torus wallet support
- **Creator Profiles**: Browse and interact with creator pages
- **Trading Interface**: Buy and sell creator tokens
- **Dashboard**: Portfolio tracking and transaction history
- **Content Feed**: View token-gated posts based on holdings

Key directories:
- `src/pages/` - Main application routes
- `src/hooks/` - Custom React hooks for Solana interactions
- `src/contexts/` - Global state management
- `src/components/` - Reusable UI components

## Technology Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Solana |
| Smart Contracts | Anchor Framework (Rust) |
| Token Standard | SPL Token 2022 |
| Backend | Express.js, Bun Runtime |
| Database | PostgreSQL with Prisma ORM |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Wallet | Solana Wallet Adapter |

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Rust and Cargo
- Solana CLI tools
- Anchor CLI
- PostgreSQL database

### Environment Setup

**Frontend** (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=http://127.0.0.1:8899
VITE_SOLANA_CLUSTER=testnet
```

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/creator_token
JWT_SECRET=your-jwt-secret
SOLANA_RPC_URL=http://127.0.0.1:8899
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/creator-token.git
cd creator-token
```

2. **Install Anchor dependencies and build**
```bash
cd anchor
yarn install
anchor build
```

3. **Start local Solana validator**
```bash
cd anchor
yarn localnet
```

4. **Setup backend**
```bash
cd ../backend
bun install
bun run db:migrate
bun run dev
```

5. **Setup frontend**
```bash
cd ../frontend
bun install
bun run dev
```

### Running Tests

```bash
cd anchor
anchor test
```

## Roadmap

Planned features for future releases:

- Allow creators to upload images and videos for posts
