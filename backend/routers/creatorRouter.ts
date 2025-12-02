import { Router } from "express";
import { creatorAddSchema, postCreateSchema } from "../validations/schema";
import { prisma } from "../src/lib/prisma";
import { protectedRoute } from "../middleware/protectedRoute";
import { ContentType } from "../generated/enums";
import { PublicKey } from "@solana/web3.js";
import { getTokenBalanceOfUser } from "../src/lib/solana";

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

  return res
    .status(200)
    .json({ creator, message: "Creator profile created successfully" });
});

// add protected route after testing
// creatorRouter.get("/trending", async (req, res) => {
//   const last100Transactions = await prisma.transaction.findMany({
//     orderBy: {
//       timestamp: "desc",
//     },
//     take: 100,
//   });

//   // Reduce the above array and rank them by the occurrence of tokenMint
//   const tokenMintCount: Record<string, number> = last100Transactions.reduce((accumulator: Record<string, number>, currentValue) => {
//     const mint = currentValue.tokenMint;
//     if (mint in Object.keys(accumulator)) {
//       accumulator[mint] += 1;
//     } else {
//       accumulator[mint] = 1; // Start with 1 for new mint
//     }
//     return accumulator;
//   }, {} as Record<string, number>);

//   console.log("Data : ", last100Transactions);

// });

creatorRouter.post("/post", protectedRoute, async (req: any, res) => {
  const { content, tokenThreshold } = req.body;

  const validInputCheck = postCreateSchema.safeParse({ content, tokenThreshold });

  if (!validInputCheck.success) {
    return res.status(400).json({ 
      error: "Invalid payload provided",
      details: validInputCheck.error.issues 
    });
  }

  const { content: validContent, tokenThreshold: validTokenThreshold } = validInputCheck.data;
  const creatorAddress = req.user.walletAddress;

  // Verify user is a creator
  const creator = await prisma.creator.findUnique({
    where: { creatorAddress },
  });

  if (!creator) {
    return res.status(403).json({ error: "Only creators can create posts" });
  }

  // Create the post
  const post = await prisma.post.create({
    data: {
      creatorAddress,
      contentUrl: validContent,
      contentType: ContentType.TEXT,
      tokenThreshold: validTokenThreshold,
    },
  });

  // Convert BigInt to string for JSON serialization
  return res.status(201).json({ 
    post: {
      ...post,
      tokenThreshold: post.tokenThreshold.toString(),
    }, 
    message: "Post created successfully" 
  });
});

creatorRouter.get("/:creatorAddress/posts", protectedRoute, async (req: any, res) => {
  const { creatorAddress } = req.params;
  const { page = "1", limit = "10" } = req.query;
  const userWalletAddress = req.user.walletAddress;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Verify creator exists
  const creator = await prisma.creator.findUnique({
    where: { creatorAddress },
    include: { token: true },
  });

  if (!creator) {
    return res.status(404).json({ error: "Creator not found" });
  }

  const tokenMint = new PublicKey(creator.token.tokenMintAddress);
  const userPubkey = new PublicKey(userWalletAddress);

  // Fetch actual token balance from chain (includes decimals)
  const { balance: userTokenBalance, decimals } = await getTokenBalanceOfUser({
    userAddress: userPubkey,
    tokenMint,
  });

  // Check if user is the creator (creators can see all their own posts)
  const isOwnProfile = userWalletAddress === creatorAddress;
  
  // Calculate multiplier for converting threshold to raw units
  const decimalMultiplier = BigInt(10 ** decimals);

  // Fetch posts with pagination
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: { creatorAddress },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.post.count({ where: { creatorAddress } }),
  ]);

  // Map posts with locked/unlocked status
  const postsWithAccess = posts.map((post) => {
    // Convert threshold to raw units (threshold * 10^decimals)
    const thresholdInRawUnits = post.tokenThreshold * decimalMultiplier;
    const canAccess = isOwnProfile || userTokenBalance >= thresholdInRawUnits;
    
    // Debug logging for each post
    console.log(`Post ${post.id}: threshold=${post.tokenThreshold} (raw: ${thresholdInRawUnits}), balance=${userTokenBalance}, canAccess=${canAccess}`);
    
    return {
      id: post.id,
      creatorAddress: post.creatorAddress,
      contentType: post.contentType,
      tokenThreshold: post.tokenThreshold.toString(),
      createdAt: post.createdAt,
      isLocked: !canAccess,
      // Only include content if user has access
      content: canAccess ? post.contentUrl : null,
    };
  });

  const totalPages = Math.ceil(totalCount / limitNum);

  return res.status(200).json({
    posts: postsWithAccess,
    userTokenBalance: userTokenBalance.toString(),
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  });
});

export default creatorRouter;
