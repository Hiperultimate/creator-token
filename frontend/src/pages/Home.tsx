import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenBalance } from '@/types/anchor';
import { Wallet, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data - replace with actual data fetching
const mockTokens: TokenBalance[] = [
  { mint: { toBase58: () => 'ABC123...' } as any, amount: 150, decimals: 6 },
  { mint: { toBase58: () => 'DEF456...' } as any, amount: 75, decimals: 6 },
  { mint: { toBase58: () => 'GHI789...' } as any, amount: 200, decimals: 6 },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/discover');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">Please connect your wallet to view your dashboard</p>
          <Button variant="default" onClick={() => navigate('/discover')}>
            Go to Discover
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
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.name || 'Creator'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your tokens and track your portfolio performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card hover:glow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,234.56</div>
                <p className="text-xs text-success">+12.5% from last month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card hover:glow-accent transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tokens Owned</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockTokens.length}</div>
                <p className="text-xs text-muted-foreground">Different creator tokens</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card hover:glow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">Buy & sell operations</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Token Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">Your Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTokens.map((token, index) => (
                  <motion.div
                    key={token.mint.toBase58()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {token.mint.toBase58().slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Creator Token #{index + 1}</h3>
                        <p className="text-sm text-muted-foreground">
                          {token.mint.toBase58().slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {(token.amount / Math.pow(10, token.decimals)).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">tokens</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Creator Section */}
        {user.isCreator && user.creatorAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  Creator Dashboard
                  <span className="text-sm px-2 py-1 bg-primary/20 rounded-full">Creator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="default" 
                    onClick={() => navigate(`/creator/${user.creatorAddress}`)}
                    className="flex-1"
                  >
                    View My Profile
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/creator/create_token')}
                    className="flex-1"
                  >
                    Create New Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}