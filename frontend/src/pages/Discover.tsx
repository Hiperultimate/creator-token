import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { checkUserBalance, requestAirdrop } from "@/lib/solana-helpers";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreatorCardSkeleton } from "@/components/skeletons";
import axios from "axios";

// Type for trending creator from API
interface TrendingCreator {
  creatorAddress: string;
  displayName: string;
  bio: string | null;
  tokenMintAddress: string;
  currentPrice: number;
  totalSupply: number;
  holdersCount: number;
  transactionCount: number;
}

// Fetch trending creators from API
const fetchTrendingCreators = async (): Promise<TrendingCreator[]> => {
  const response = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/creator/trending`
  );
  return response.data.creators;
};

export default function Discover() {
  // Temp - Airdrop functionality
  const client = useQueryClient();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { data: balanceInSol, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["get-balance"],
    queryFn: () => checkUserBalance(wallet.publicKey, connection),
    enabled: !!wallet.publicKey,
  });

  // Fetch trending creators
  const { data: trendingCreators = [], isLoading: isCreatorsLoading } = useQuery({
    queryKey: ["trending-creators"],
    queryFn: fetchTrendingCreators,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredCreators = trendingCreators.filter(
    (creator) =>
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (creator.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Airdrop Section - Only show when wallet connected */}
        {wallet.publicKey && (
          <div className="mb-6 p-4 glass-card rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Your Balance: </span>
                <span className="font-semibold">
                  {isBalanceLoading ? "Loading..." : `${balanceInSol?.toFixed(2) ?? 0} SOL`}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await requestAirdrop(wallet.publicKey, connection, 5);
                  client.invalidateQueries({ queryKey: ["get-balance"] });
                }}
              >
                Airdrop 5 SOL
              </Button>
            </div>
          </div>
        )}
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
            Invest in your favorite creators and get exclusive access to their
            content
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
          {/* Loading State */}
          {isCreatorsLoading && <CreatorCardSkeleton count={3} />}

          {/* Creators List */}
          {!isCreatorsLoading &&
            filteredCreators.map((creator, index) => (
              <motion.div
                key={creator.creatorAddress}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="glass-card hover:glow-primary transition-all duration-300 cursor-pointer group h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {creator.displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {creator.displayName}
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
                  <CardContent className="flex flex-col flex-1">
                    <div className="space-y-4 pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {creator.bio || "No bio available"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-muted-foreground">
                            Current Price
                          </div>
                          <div className="font-semibold text-success">
                            {creator.currentPrice} SOL
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">
                            Total Supply
                          </div>
                          <div className="font-semibold">
                            {creator.totalSupply.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      className="w-full mt-auto"
                      onClick={() =>
                        navigate(`/creator/${creator.creatorAddress}`)
                      }
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>

        {/* Empty State */}
        {!isCreatorsLoading && filteredCreators.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No creators found" : "No trending creators yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms or browse all creators"
                : "Be the first to create your token and start trending!"}
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
                Share your content, build your community, and monetize your
                creativity
              </p>
              <Button
                variant="default"
                size="lg"
                onClick={() => navigate("/creator/create_identity")}
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
