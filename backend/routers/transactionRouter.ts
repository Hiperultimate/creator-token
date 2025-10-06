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

  const { tokenMint, type, amount, walletAddress, isHoldingTokenZero } = validInputCheck.data;

  // Check if wallet matches
  if (req.user && (req.user.walletAddress !== walletAddress)) {
    return res.status(403).send("Forbidden");
  }

  // Map type to enum
  const transactionType = type === "buy" ? TransactionType.BUY : TransactionType.SELL;

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

export default transactionRouter;
