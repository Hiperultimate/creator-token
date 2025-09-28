import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAnchor } from '@/hooks/useAnchor';
import { Creator, Post } from '@/types/anchor';
import { 
  Users, 
  TrendingUp, 
  Lock, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  FileText,
  ArrowUp,
  ArrowDown,
  Upload,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock creator data
const mockCreator: Creator = {
  pubkey: { toBase58: () => 'Creator1' } as any,
  identity: {
    creator: { toBase58: () => 'Creator1' } as any,
    creatorName: 'Alice Johnson',
    proofUrl: 'Crypto artist and NFT creator building the future of digital art. Sharing exclusive insights, tutorials, and behind-the-scenes content.',
  },
  currentPrice: 0.15,
  totalSupply: 10000,
  holdersCount: 145,
};

// Mock posts data
const mockPosts: Post[] = [
  {
    id: '1',
    creatorId: 'Creator1',
    content: 'Just finished working on my latest NFT collection! Here\'s a sneak peek at the concept art.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    requiredTokens: 0,
    createdAt: new Date('2024-01-15'),
    type: 'image',
  },
  {
    id: '2',
    creatorId: 'Creator1',
    content: 'Exclusive: My complete guide to creating generative art with AI. This tutorial covers everything from prompting to minting.',
    videoUrl: 'https://example.com/video1.mp4',
    requiredTokens: 50,
    createdAt: new Date('2024-01-10'),
    type: 'video',
  },
  {
    id: '3',
    creatorId: 'Creator1',
    content: 'Market analysis: Why I think the next bull run will be driven by utility tokens rather than meme coins.',
    requiredTokens: 25,
    createdAt: new Date('2024-01-05'),
    type: 'text',
  },
];

export default function CreatorProfile() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { buyToken, sellToken, getBuyingCost, getSellingReturn } = useAnchor();
  const navigate = useNavigate();
  
  const [creator, setCreator] = useState<Creator | null>(mockCreator);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [userBalance, setUserBalance] = useState(75); // Mock user token balance
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyingCost, setBuyingCost] = useState(0);
  const [sellingReturn, setSellingReturn] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Create post form state
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postRequiredTokens, setPostRequiredTokens] = useState('0');
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const isOwnProfile = user?.creatorId === creatorId;

  useEffect(() => {
    // Calculate buying cost when amount changes
    if (buyAmount && !isNaN(Number(buyAmount))) {
      getBuyingCost(Number(buyAmount)).then(setBuyingCost);
    } else {
      setBuyingCost(0);
    }
  }, [buyAmount, getBuyingCost]);

  useEffect(() => {
    // Calculate selling return when amount changes
    if (sellAmount && !isNaN(Number(sellAmount))) {
      getSellingReturn(Number(sellAmount)).then(setSellingReturn);
    } else {
      setSellingReturn(0);
    }
  }, [sellAmount, getSellingReturn]);

  const handleBuyTokens = async () => {
    if (!buyAmount || !isAuthenticated) return;
    
    try {
      await buyToken(Number(buyAmount));
      setUserBalance(prev => prev + Number(buyAmount));
      setBuyAmount('');
      // Show success toast
    } catch (error) {
      console.error('Error buying tokens:', error);
      // Show error toast
    }
  };

  const handleSellTokens = async () => {
    if (!sellAmount || !isAuthenticated) return;
    
    try {
      await sellToken(Number(sellAmount));
      setUserBalance(prev => prev - Number(sellAmount));
      setSellAmount('');
      // Show success toast
    } catch (error) {
      console.error('Error selling tokens:', error);
      // Show error toast
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setFilePreview(url);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    
    try {
      // TODO: Implement actual backend API call to create post
      const newPost: Post = {
        id: Date.now().toString(),
        creatorId: creatorId || '',
        content: postContent,
        requiredTokens: Number(postRequiredTokens),
        createdAt: new Date(),
        type: postType,
        ...(postType === 'image' && postFile && { imageUrl: filePreview || undefined }),
        ...(postType === 'video' && postFile && { videoUrl: filePreview || undefined }),
      };
      
      setPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setPostContent('');
      setPostType('text');
      setPostFile(null);
      setFilePreview(null);
      setPostRequiredTokens('0');
      setShowCreatePost(false);
      
      // Show success toast
      console.log('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      // Show error toast
    }
  };

  const resetCreatePostForm = () => {
    setPostContent('');
    setPostType('text');
    setPostFile(null);
    setFilePreview(null);
    setPostRequiredTokens('0');
  };

  const canViewPost = (post: Post) => {
    return post.requiredTokens <= userBalance || isOwnProfile;
  };

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Creator not found</h2>
          <p className="text-muted-foreground mb-4">This creator profile doesn't exist</p>
          <Button variant="default" onClick={() => navigate('/discover')}>
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
                  <h1 className="text-3xl font-bold mb-2">{creator.identity.creatorName}</h1>
                  <p className="text-muted-foreground">{creator.identity.proofUrl}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-success animate-counter">
                      {creator.currentPrice} SOL
                    </div>
                    <div className="text-sm text-muted-foreground">Current Price</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold animate-counter">
                      {creator.totalSupply?.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Supply</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent animate-counter">
                      {creator.holdersCount}
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
                    {buyingCost > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Cost: {buyingCost.toFixed(4)} SOL
                      </p>
                    )}
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
                        disabled={!sellAmount || !isAuthenticated || Number(sellAmount) > userBalance}
                      >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        Sell
                      </Button>
                    </div>
                    {sellingReturn > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Return: {sellingReturn.toFixed(4)} SOL
                      </p>
                    )}
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
                <Dialog open={showCreatePost} onOpenChange={(open) => {
                  setShowCreatePost(open);
                  if (!open) resetCreatePostForm();
                }}>
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
                            variant={postType === 'text' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPostType('text')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Text
                          </Button>
                          <Button
                            type="button"
                            variant={postType === 'image' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPostType('image')}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Image
                          </Button>
                          <Button
                            type="button"
                            variant={postType === 'video' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPostType('video')}
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
                      {(postType === 'image' || postType === 'video') && (
                        <div className="space-y-2">
                          <Label htmlFor="file">
                            {postType === 'image' ? 'Upload Image' : 'Upload Video'}
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
                                  accept={postType === 'image' ? 'image/*' : 'video/*'}
                                  onChange={handleFileChange}
                                  className="max-w-xs"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {postType === 'image' && filePreview && (
                                  <img
                                    src={filePreview}
                                    alt="Preview"
                                    className="max-w-full h-32 object-cover rounded mx-auto"
                                  />
                                )}
                                {postType === 'video' && filePreview && (
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
                                      setPostFile(null);
                                      setFilePreview(null);
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
                        <Label htmlFor="requiredTokens">Required Tokens to View</Label>
                        <Input
                          id="requiredTokens"
                          type="number"
                          placeholder="0"
                          value={postRequiredTokens}
                          onChange={(e) => setPostRequiredTokens(e.target.value)}
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Set to 0 for public posts, or specify tokens required to view
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreatePost(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleCreatePost}
                          disabled={!postContent.trim()}
                        >
                          Create Post
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`glass-card ${!canViewPost(post) ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {post.type === 'text' && <FileText className="h-4 w-4 text-blue-500" />}
                          {post.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                          {post.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                          <span className="text-sm text-muted-foreground">
                            {post.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        {post.requiredTokens > 0 && (
                          <Badge variant={canViewPost(post) ? "default" : "destructive"}>
                            {canViewPost(post) ? (
                              `${post.requiredTokens} tokens required`
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> Locked</>
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
                              <p className="text-sm text-muted-foreground">Video content available</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Hold at least {post.requiredTokens} tokens to view this content
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
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}