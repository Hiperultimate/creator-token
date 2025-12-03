import { Router } from "express";
import { transactionAddSchema } from "../validations/schema";
import { prisma } from "../src/lib/prisma";
import { protectedRoute } from "../middleware/protectedRoute";
import { TransactionType } from "../generated/enums";

const transactionRouter = Router();

transactionRouter.post("/add", protectedRoute, async (req: any, res) => {
  const {
    tokenMint: tokenMintRaw,
    type: typeRaw,
    amount: amountRaw,
    walletAddress: walletAddressRaw,
    isHoldingTokenZero: isHoldingTokenZeroRaw,
  } = req.body;

  const validInputCheck = transactionAddSchema.safeParse({
    tokenMint: tokenMintRaw,
    type: typeRaw,
    amount: amountRaw,
    walletAddress: walletAddressRaw,
    isHoldingTokenZero: isHoldingTokenZeroRaw,
  });

  if (!validInputCheck.success) {
    return res.status(400).send("Invalid payload provided.");
  }

  const { tokenMint, type, amount, walletAddress, isHoldingTokenZero } =
    validInputCheck.data;

  // check if tokenMint is valid
  const tokenMintExist = await prisma.creatorToken.findUnique({ where : { tokenMintAddress: tokenMint } });
  if(tokenMintExist === null) {
    return res.status(400).send("Invalid token mint provided.");
  }

  // Check if wallet matches
  if (req.user && req.user.walletAddress !== walletAddress) {
    return res.status(403).send("Forbidden");
  }

  // Map type to enum
  const transactionType =
    type === "buy" ? TransactionType.BUY : TransactionType.SELL;

  // Create transaction
  await prisma.transaction.create({
    data: {
      tokenMint,
      type: transactionType,
      amount,
      walletAddress,
    },
  });

  // If buy, upsert userToken
  if (type === "buy") {
    await prisma.userToken.upsert({
      where: {
        walletAddress_tokenMint: {
          walletAddress,
          tokenMint,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        walletAddress,
        tokenMint,
      },
    });
  } else if (type === "sell" && isHoldingTokenZero) {
    // If selling and balance is zero, remove userToken
    await prisma.userToken.deleteMany({
      where: {
        walletAddress,
        tokenMint,
      },
    });
  }

  return res.status(200).send("Transaction added successfully");
});

transactionRouter.get("/user-stats", protectedRoute, async (req: any, res) => {
  const walletAddress = req.user.walletAddress;

  const totalOperations = await prisma.transaction.count({
    where: { walletAddress },
  });

  const ownedTokens = await prisma.userToken.findMany({
    where: { walletAddress },
    select: {
      tokenMint: true,
    },
  });

  // Fetch creator details for each token mint
  const ownedTokensWithCreator = await Promise.all(
    ownedTokens.map(async (t) => {
      // Find the creator who owns this token mint
      const creatorToken = await prisma.creatorToken.findUnique({
        where: { tokenMintAddress: t.tokenMint },
        include: {
          creator: {
            select: {
              displayName: true,
              creatorAddress: true,
            },
          },
        },
      });

      if (!creatorToken || !creatorToken.creator) {
        return null;
      }

      return {
        tokenMint: t.tokenMint,
        creatorWallet: creatorToken.creatorAddress,
        creatorName: creatorToken.creator.displayName,
      };
    })
  );

  // Filter out tokens where creator wasn't found
  const validTokens = ownedTokensWithCreator.filter((t) => t !== null);

  return res.json({
    totalOperations,
    ownedTokens: validTokens,
  });
});

export default transactionRouter;
