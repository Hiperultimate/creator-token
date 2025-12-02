import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Creator, Post } from "@/types/anchor";
import {
  TrendingUp,
  Lock,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import useTokenDetails from "@/hooks/useTokenDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTokenBalance } from "@/hooks/userDetails";
import { useCreatorPosts } from "@/hooks/useCreatorPosts";
import { useTokenTrading, formatSolAmount } from "@/hooks/useTokenTrading";
import { useCreatePost } from "@/hooks/useCreatePost";

// Mock creator data
const mockCreator: Creator = {
  pubkey: {
    toBase58: () => "GGsw1CyeMFkH7eo2ta8p2DgzzWApzFLkX1D4Q3HXsFHR",
  } as any,
  identity: {
    creator: {
      toBase58: () => "GGsw1CyeMFkH7eo2ta8p2DgzzWApzFLkX1D4Q3HXsFHR",
    } as any,
    creatorName: "Hiperultimate",
    proofUrl:
      "Crypto artist and NFT creator building the future of digital art. Sharing exclusive insights, tutorials, and behind-the-scenes content.",
  },
  currentPrice: 0.15,
  totalSupply: 10000,
  holdersCount: 145,
};

export default function CreatorProfile() {
  const { creatorAddress } = useParams<{ creatorAddress: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { publicKey: userAddress } = useWallet();

  const creatorPubkey = new PublicKey(mockCreator.pubkey.toBase58());

  // Token details
  const {
    tokenDetails,
    tokenSupply,
    currentTokenPrice,
    tokenHolderCount,
    isLoading: tokenDetailsLoading,
  } = useTokenDetails(creatorPubkey);

  const { data: getUserBalance } = useGetTokenBalance({
    tokenMint: tokenDetails && tokenDetails.address,
  });

  // Posts hook
  const {
    posts,
    isLoadingPosts,
    isLoadingMore,
    hasNextPage,
    loadMoreTriggerRef,
    addPost,
  } = useCreatorPosts({
    creatorAddress,
    isAuthenticated,
  });

  // Token trading hook
  const {
    buyAmount,
    setBuyAmount,
    buyingCost,
    isBuyingCostLoading,
    handleBuyTokens,
    sellAmount,
    setSellAmount,
    sellingReturn,
    isSellingCostLoading,
    handleSellTokens,
    userBalance,
    setUserBalance,
  } = useTokenTrading({
    userAddress,
    creatorAddress: creatorPubkey,
    tokenDetails: tokenDetails
      ? { address: tokenDetails.address, decimals: tokenDetails.decimals }
      : undefined,
    isAuthenticated,
  });

  // Create post hook
  const {
    postContent,
    setPostContent,
    postType,
    setPostType,
    postFile,
    postRequiredTokens,
    setPostRequiredTokens,
    filePreview,
    showCreatePost,
    setShowCreatePost,
    handleFileChange,
    handleCreatePost,
    isCreatingPost,
  } = useCreatePost({
    creatorAddress: creatorAddress || "",
    onPostCreated: addPost,
  });

  const isOwnProfile = user?.creatorAddress === creatorAddress;
  const creator = mockCreator;

  // Update user balance when token balance is fetched
  useEffect(() => {
    if (getUserBalance) {
      setUserBalance(getUserBalance.value.uiAmount);
    }
  }, [getUserBalance, setUserBalance]);

  const canViewPost = (post: Post) => {
    if ("isLocked" in post) {
      return !post.isLocked;
    }
    // Fallback for newly created posts (before API refresh)
    return post.requiredTokens <= userBalance || isOwnProfile;
  };

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Creator not found</h2>
          <p className="text-muted-foreground mb-4">
            This creator profile doesn't exist
          </p>
          <Button variant="default" onClick={() => navigate("/discover")}>
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Creator Profile Header */}
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {creator.identity.creatorName.charAt(0)}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {creator.identity.creatorName}
                  </h1>
                  <p className="text-muted-foreground">
                    {creator.identity.proofUrl}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-success animate-counter flex flex-col items-center">
                      {tokenDetailsLoading ? (
                        <Skeleton className="h-8 w-full max-w-[10rem]" />
                      ) : (
                        <>{currentTokenPrice} SOL</>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current Price
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold animate-counter flex flex-col items-center">
                      {tokenDetailsLoading ? (
                        <Skeleton className="h-8 w-full max-w-[10rem]" />
                      ) : (
                        (tokenSupply ?? 0).toLocaleString()
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Supply
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent animate-counter flex flex-col items-center">
                      {tokenDetailsLoading ? (
                        <Skeleton className="h-8 w-full max-w-[10rem]" />
                      ) : (
                        (tokenHolderCount ?? 0).toLocaleString()
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Holders</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Section */}
          <div className="lg:col-span-1 space-y-6">
            {isAuthenticated && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trade Tokens
                  </CardTitle>
                  {userBalance > 0 && (
                    <Badge variant="secondary">
                      You own: {userBalance} tokens
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buy Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buy Tokens</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="default"
                        onClick={handleBuyTokens}
                        disabled={!buyAmount || !isAuthenticated}
                      >
                        <ArrowUp className="h-4 w-4 mr-1" />
                        Buy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isBuyingCostLoading && <span>Price loading...</span>}
                      {!isBuyingCostLoading && buyingCost && (
                        <span>
                          {" "}
                          Cost: {formatSolAmount(buyingCost)} SOL
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Sell Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sell Tokens</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        max={userBalance}
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleSellTokens}
                        disabled={
                          !sellAmount ||
                          !isAuthenticated ||
                          Number(sellAmount) > userBalance
                        }
                      >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        Sell
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isSellingCostLoading && <span>Price loading...</span>}
                      {!isSellingCostLoading && sellingReturn && (
                        <span> Cost: {formatSolAmount(sellingReturn)} SOL</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isAuthenticated && (
              <Card className="glass-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Connect to Trade</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet to buy and sell tokens
                  </p>
                  <Button variant="default" className="w-full">
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Content Feed</h2>
              {isOwnProfile && (
                <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Post Type Selection */}
                      <div className="space-y-2">
                        <Label>Post Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              postType === "text" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setPostType("text")}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Text
                          </Button>
                          <Button
                            type="button"
                            variant={
                              postType === "image" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setPostType("image")}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Image
                          </Button>
                          <Button
                            type="button"
                            variant={
                              postType === "video" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setPostType("video")}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Video
                          </Button>
                        </div>
                      </div>

                      {/* Content Input */}
                      <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          placeholder="Write your post content..."
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          rows={4}
                        />
                      </div>

                      {/* File Upload for Image/Video */}
                      {(postType === "image" || postType === "video") && (
                        <div className="space-y-2">
                          <Label htmlFor="file">
                            {postType === "image"
                              ? "Upload Image"
                              : "Upload Video"}
                          </Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6">
                            {!postFile ? (
                              <div className="text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-2">
                                  Click to upload {postType} or drag and drop
                                </p>
                                <Input
                                  id="file"
                                  type="file"
                                  accept={
                                    postType === "image" ? "image/*" : "video/*"
                                  }
                                  onChange={handleFileChange}
                                  className="max-w-xs"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {postType === "image" && filePreview && (
                                  <img
                                    src={filePreview}
                                    alt="Preview"
                                    className="max-w-full h-32 object-cover rounded mx-auto"
                                  />
                                )}
                                {postType === "video" && filePreview && (
                                  <video
                                    src={filePreview}
                                    controls
                                    className="max-w-full h-32 rounded mx-auto"
                                  />
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    {postFile.name}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Reset file through the hook
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Required Tokens */}
                      <div className="space-y-2">
                        <Label htmlFor="requiredTokens">
                          Required Tokens to View
                        </Label>
                        <Input
                          id="requiredTokens"
                          type="number"
                          placeholder="0"
                          value={postRequiredTokens}
                          onChange={(e) =>
                            setPostRequiredTokens(e.target.value)
                          }
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Set to 0 for public posts, or specify tokens required
                          to view
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreatePost(false)}
                          disabled={isCreatingPost}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleCreatePost}
                          disabled={!postContent.trim() || isCreatingPost}
                        >
                          {isCreatingPost ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Creating...
                            </>
                          ) : (
                            "Create Post"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {/* Initial loading state */}
              {isLoadingPosts && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass-card">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoadingPosts && posts.length === 0 && (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile
                        ? "Create your first post to share with your community!"
                        : "This creator hasn't posted any content yet."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Posts list */}
              {!isLoadingPosts &&
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.1, 0.5) }}
                  >
                    <Card
                      className={`glass-card ${
                        !canViewPost(post) ? "opacity-60" : ""
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {post.type === "text" && (
                              <FileText className="h-4 w-4 text-blue-500" />
                            )}
                            {post.type === "image" && (
                              <ImageIcon className="h-4 w-4 text-green-500" />
                            )}
                            {post.type === "video" && (
                              <Video className="h-4 w-4 text-purple-500" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {post.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                          {post.requiredTokens > 0 && (
                            <Badge
                              variant={
                                canViewPost(post) ? "default" : "destructive"
                              }
                            >
                              {canViewPost(post) ? (
                                `${post.requiredTokens} tokens required`
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" /> Locked
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {canViewPost(post) ? (
                          <div className="space-y-4">
                            <p>{post.content}</p>
                            {post.imageUrl && (
                              <img
                                src={post.imageUrl}
                                alt="Post content"
                                className="rounded-lg w-full max-h-64 object-cover"
                              />
                            )}
                            {post.videoUrl && (
                              <div className="bg-gradient-card rounded-lg p-4 text-center">
                                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Video content available
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Hold at least {post.requiredTokens} tokens to view
                              this content
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              You currently have {userBalance} tokens
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

              {/* Load more infinite scroll logic */}
              <div ref={loadMoreTriggerRef} className="py-4">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more posts...</span>
                  </div>
                )}
              </div>

              {/* End of posts indicator */}
              {!isLoadingPosts && !hasNextPage && posts.length > 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  You've reached the end
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
