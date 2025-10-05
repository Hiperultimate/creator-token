-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_token_balances" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_token_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "identityAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,
    "basePrice" BIGINT NOT NULL,
    "slope" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "tokenThreshold" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "walletPublicKey" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "user_token_balances_walletAddress_idx" ON "user_token_balances"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "user_token_balances_walletAddress_tokenMint_key" ON "user_token_balances"("walletAddress", "tokenMint");

-- CreateIndex
CREATE UNIQUE INDEX "creators_identityAddress_key" ON "creators"("identityAddress");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_creatorId_key" ON "tokens"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_tokenMintAddress_key" ON "tokens"("tokenMintAddress");

-- CreateIndex
CREATE INDEX "posts_creatorId_createdAt_idx" ON "posts"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_tokenMint_timestamp_idx" ON "transactions"("tokenMint", "timestamp");

-- AddForeignKey
ALTER TABLE "user_token_balances" ADD CONSTRAINT "user_token_balances_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "users"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creator_user_fk" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creator_token_fk" FOREIGN KEY ("id") REFERENCES "tokens"("creatorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
