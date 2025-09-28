import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Creator } from '@/types/anchor';
import { Search, TrendingUp, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock creators data - replace with actual data fetching
const mockCreators: Creator[] = [
  {
    pubkey: { toBase58: () => 'Creator1' } as any,
    identity: {
      creator: { toBase58: () => 'Creator1' } as any,
      creatorName: 'Alice Johnson',
      proofUrl: 'Crypto artist and NFT creator building the future of digital art',
    },
    currentPrice: 0.15,
    totalSupply: 10000,
    holdersCount: 145,
  },
  {
    pubkey: { toBase58: () => 'Creator2' } as any,
    identity: {
      creator: { toBase58: () => 'Creator2' } as any,
      creatorName: 'Bob Williams',
      proofUrl: 'DeFi educator sharing insights about yield farming and protocols',
    },
    currentPrice: 0.08,
    totalSupply: 25000,
    holdersCount: 89,
  },
  {
    pubkey: { toBase58: () => 'Creator3' } as any,
    identity: {
      creator: { toBase58: () => 'Creator3' } as any,
      creatorName: 'Carol Smith',
      proofUrl: 'Web3 developer creating tutorials and open-source tools',
    },
    currentPrice: 0.22,
    totalSupply: 5000,
    holdersCount: 234,
  },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredCreators = mockCreators.filter(creator =>
    creator.identity.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.identity.proofUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Discover Creators
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Invest in your favorite creators and get exclusive access to their content
          </motion.p>

          {/* Search Bar */}
          <motion.div 
            className="relative max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass bg-background/50"
            />
          </motion.div>
        </div>

        {/* Trending Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="text-2xl font-bold">Trending Creators</h2>
          </div>
        </motion.div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.pubkey.toBase58()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
            >
              <Card className="glass-card hover:glow-primary transition-all duration-300 cursor-pointer group h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {creator.identity.creatorName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {creator.identity.creatorName}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {creator.holdersCount} holders
                        </div>
                      </div>
                    </div>
                    <Star className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {creator.identity.proofUrl}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Current Price</div>
                      <div className="font-semibold text-success">
                        {creator.currentPrice} SOL
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Total Supply</div>
                      <div className="font-semibold">
                        {creator.totalSupply?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => navigate(`/creator/${creator.pubkey.toBase58()}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCreators.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all creators
            </p>
          </motion.div>
        )}

        {/* CTA for becoming a creator */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="glass-card border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Become a Creator</h3>
              <p className="text-muted-foreground mb-6">
                Share your content, build your community, and monetize your creativity
              </p>
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate('/creator/create_identity')}
              >
                Start Creating Today
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}