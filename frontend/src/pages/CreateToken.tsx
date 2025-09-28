import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useAnchor } from '@/hooks/useAnchor';
import { Coins, TrendingUp, AlertCircle, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const createTokenSchema = z.object({
  decimals: z.number().min(0).max(9),
  basePrice: z.number().min(0.001, 'Base price must be at least 0.001 SOL'),
  slope: z.number().min(0.0001, 'Slope must be at least 0.0001'),
});

export default function CreateToken() {
  const [decimals, setDecimals] = useState(6);
  const [basePrice, setBasePrice] = useState(0.01);
  const [slope, setSlope] = useState(0.001);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { isAuthenticated, user } = useAuth();
  const { createCreatorToken } = useAnchor();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate example prices
  const calculatePrice = (tokenAmount: number) => {
    return basePrice + (slope * tokenAmount);
  };

  const validateForm = () => {
    try {
      createTokenSchema.parse({ decimals, basePrice, slope });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user?.isCreator) {
      toast({
        title: "Not authorized",
        description: "You must be a creator to create tokens",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert to the format expected by the smart contract
      const basePriceInLamports = Math.floor(basePrice * 1e9); // Convert SOL to lamports
      const slopeInLamports = Math.floor(slope * 1e9);
      
      await createCreatorToken(decimals, basePriceInLamports, slopeInLamports);
      
      toast({
        title: "Token created successfully!",
        description: "Your creator token is now live. You can start sharing content!",
      });

      // Redirect to creator profile
      navigate(`/creator/${user.creatorId}`);
      
    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: "Error creating token",
        description: "There was an error creating your token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass-card max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to create a token
            </p>
            <Button variant="default" onClick={() => navigate('/discover')}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.isCreator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass-card max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-warning mb-4" />
            <h2 className="text-2xl font-bold mb-2">Creator Identity Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to create your creator identity before you can create tokens
            </p>
            <Button variant="default" onClick={() => navigate('/creator/create_identity')}>
              Create Identity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Coins className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create Your Token
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Set up the economics of your creator token
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Decimals */}
                  <div className="space-y-3">
                    <Label htmlFor="decimals" className="text-sm font-medium">
                      Decimals
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        value={[decimals]}
                        onValueChange={(value) => setDecimals(value[0])}
                        max={9}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span className="font-medium">{decimals}</span>
                        <span>9</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Number of decimal places for your token (6 is recommended)
                    </p>
                  </div>

                  {/* Base Price */}
                  <div className="space-y-2">
                    <Label htmlFor="basePrice" className="text-sm font-medium">
                      Base Price (SOL) *
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className={`glass ${errors.basePrice ? 'border-destructive' : ''}`}
                    />
                    {errors.basePrice && (
                      <p className="text-xs text-destructive">{errors.basePrice}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Starting price for the first token
                    </p>
                  </div>

                  {/* Slope */}
                  <div className="space-y-2">
                    <Label htmlFor="slope" className="text-sm font-medium">
                      Price Slope *
                    </Label>
                    <Input
                      id="slope"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="0.001"
                      value={slope}
                      onChange={(e) => setSlope(Number(e.target.value))}
                      className={`glass ${errors.slope ? 'border-destructive' : ''}`}
                    />
                    {errors.slope && (
                      <p className="text-xs text-destructive">{errors.slope}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      How much the price increases per token sold
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-gradient-card border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Important</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• These settings cannot be changed after creation</li>
                          <li>• Choose your pricing carefully based on your content value</li>
                          <li>• Lower base price and slope make tokens more accessible</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || basePrice <= 0 || slope <= 0}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Token...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Create Token
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Price Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Price Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Based on your current settings, here's how your token pricing will work:
                  </p>
                  
                  <div className="space-y-3">
                    {[1, 10, 100, 1000].map((amount) => (
                      <div key={amount} className="flex justify-between items-center p-3 rounded-lg bg-gradient-card">
                        <span className="text-sm">Token #{amount}</span>
                        <span className="font-semibold text-success">
                          {calculatePrice(amount).toFixed(4)} SOL
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Cost for 100 tokens:</span>
                      <span className="text-success">
                        {(() => {
                          let total = 0;
                          for (let i = 1; i <= 100; i++) {
                            total += calculatePrice(i);
                          }
                          return total.toFixed(4);
                        })()} SOL
                      </span>
                    </div>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-accent mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-accent mb-1">Pricing Strategy</p>
                        <p className="text-muted-foreground">
                          Your current settings create {slope < 0.01 ? 'gradual' : 'steep'} price increases. 
                          This {slope < 0.01 ? 'encourages early adoption' : 'rewards early supporters more'}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}