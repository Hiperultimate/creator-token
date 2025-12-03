import { Router } from "express";
import { creatorAddSchema, postCreateSchema } from "../validations/schema";
import { prisma } from "../src/lib/prisma";
import { protectedRoute } from "../middleware/protectedRoute";
import { ContentType } from "../generated/enums";
import { PublicKey } from "@solana/web3.js";
import {
  getTokenBalanceOfUser,
  getTokenMintInfo,
  getTokenHoldersCount,
  calculateTokenPrice,
} from "../src/lib/solana";

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

// Get trending creators based on recent transaction activity
creatorRouter.get("/trending", async (req, res) => {
  console.log("At least we are running? ");
  try {
    // Get the last 100 transactions
    const last100Transactions = await prisma.transaction.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    // If no transactions, return empty array
    if (last100Transactions.length === 0) {
      return res.status(200).json({ creators: [] });
    }

    // Count occurrences of each tokenMint to determine trending
    const tokenMintCount: Record<string, number> = last100Transactions.reduce(
      (accumulator: Record<string, number>, tokenDetails) => {
        const mint = tokenDetails.tokenMint;
        accumulator[mint] = (accumulator[mint] || 0) + 1;
        return accumulator;
      },
      {}
    );

    console.log("Checking tokenMintCount : ", tokenMintCount);

    // Sort by count and get top 3
    const topMints = Object.entries(tokenMintCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mint]) => mint);

    // Fetch creator details for each top mint
    const trendingCreators = await Promise.all(
      topMints.map(async (tokenMintAddress) => {
        // Get creator token record to find creator
        const creatorToken = await prisma.creatorToken.findUnique({
          where: { tokenMintAddress },
          include: {
            creator: true,
          },
        });

        console.log("Checking token mint : ", creatorToken, tokenMintAddress);

        if (!creatorToken || !creatorToken.creator) {
          return null;
        }

        const tokenMint = new PublicKey(tokenMintAddress);

        // Fetch on-chain data in parallel
        const [mintInfo, holdersCount] = await Promise.all([
          getTokenMintInfo(tokenMint),
          getTokenHoldersCount(tokenMint),
        ]);

        // Calculate current price from bonding curve
        const currentPrice = calculateTokenPrice({
          basePrice: creatorToken.basePrice,
          slope: creatorToken.slope,
          supply: mintInfo.supply,
          decimals: mintInfo.decimals,
        });

        // Convert supply to human-readable
        const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);

        return {
          creatorAddress: creatorToken.creatorAddress,
          displayName: creatorToken.creator.displayName,
          bio: creatorToken.creator.bio,
          tokenMintAddress: tokenMintAddress,
          currentPrice: Number(currentPrice.toFixed(6)),
          totalSupply: Math.floor(totalSupply),
          holdersCount,
          transactionCount: tokenMintCount[tokenMintAddress],
        };
      })
    );

    // Filter out any null results
    const validCreators = trendingCreators.filter(
      (creator): creator is NonNullable<typeof creator> => creator !== null
    );

    return res.status(200).json({ creators: validCreators });
  } catch (error) {
    console.error("Error fetching trending creators:", error);
    return res.status(500).json({ error: "Failed to fetch trending creators" });
  }
});

// Get creator profile by address
creatorRouter.get("/:creatorAddress", async (req, res) => {
  const { creatorAddress } = req.params;

  const creator = await prisma.creator.findUnique({
    where: { creatorAddress },
    include: {
      token: {
        select: {
          tokenMintAddress: true,
        },
      },
    },
  });

  if (!creator) {
    return res.status(404).json({ error: "Creator not found" });
  }

  return res.status(200).json({
    creatorAddress: creator.creatorAddress,
    displayName: creator.displayName,
    bio: creator.bio,
    identityAddress: creator.identityAddress,
    tokenMintAddress: creator.token.tokenMintAddress,
    createdAt: creator.createdAt,
  });
});

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
