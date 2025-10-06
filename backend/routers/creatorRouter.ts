import { Router } from "express";
import { creatorAddSchema } from "../validations/schema";
import { prisma } from "../src/lib/prisma";
import { protectedRoute } from "../middleware/protectedRoute";

const creatorRouter = Router();

creatorRouter.post("/add", protectedRoute, async (req: any, res) => {
  const {
    displayName,
    bio,
    identityAddress,
    userAddress,
    tokenMintAddress,
    basePrice,
    slope,
  } = req.body;

  const validInputCheck = creatorAddSchema.safeParse({
    displayName,
    bio,
    identityAddress,
    userAddress,
    tokenMintAddress,
    basePrice,
    slope,
  });

  if (!validInputCheck.success) {
    return res.status(400).send("Invalid payload provided.");
  }

  const { displayName: validDisplayName, bio: validBio, identityAddress: validIdentityAddress, userAddress: validUserAddress, tokenMintAddress: validTokenMintAddress, basePrice: validBasePrice, slope: validSlope } = validInputCheck.data;

  // Check if wallet matches
  if (req.user.walletAddress !== validUserAddress) {
    return res.status(403).send("Forbidden");
  }

  // Find user by walletAddress = validIdentityAddress
  const user = await prisma.user.findUnique({
    where: { walletAddress: validUserAddress },
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  // Create creator token and creator in a transaction
  const creator = await prisma.$transaction(async (tx) => {
    // Create creator token first
    await tx.creatorToken.create({
      data: {
        creatorAddress: user.walletAddress,
        tokenMintAddress: validTokenMintAddress,
        basePrice: validBasePrice,
        slope: validSlope,
      },
    });

    // Create creator
    return await tx.creator.create({
      data: {
        creatorAddress: user.walletAddress,
        displayName: validDisplayName,
        bio: validBio,
        identityAddress: validIdentityAddress,
      },
    });
  });

  return res.status(200).json({ creator, message: "Creator profile created successfully" });
});

export default creatorRouter;