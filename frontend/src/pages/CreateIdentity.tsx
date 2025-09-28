import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAnchor } from '@/hooks/useAnchor';
import { User, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const createIdentitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(200, 'Bio must be less than 200 characters'),
});

export default function CreateIdentity() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { isAuthenticated, updateUser } = useAuth();
  const { createCreatorIdentity } = useAnchor();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    try {
      createIdentitySchema.parse({ name, bio });
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
    
    if (!isAuthenticated) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an identity",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Call anchor method to create creator identity
      await createCreatorIdentity(name, bio);
      
      // Update user context
      updateUser({
        isCreator: true,
        name: name,
        creatorId: 'new-creator-id', // This would be returned from the anchor call
      });

      toast({
        title: "Identity created successfully!",
        description: "You are now a creator. Let's create your first token.",
      });

      // Redirect to create token page
      navigate('/creator/create_token');
      
    } catch (error) {
      console.error('Error creating identity:', error);
      toast({
        title: "Error creating identity",
        description: "There was an error creating your creator identity. Please try again.",
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
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to create your creator identity
            </p>
            <Button variant="default" onClick={() => navigate('/discover')}>
              Go to Discover
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
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create Your Identity
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Start your journey as a creator and build your community
          </motion.p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Creator Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Creator Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your creator name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`glass ${errors.name ? 'border-destructive' : ''}`}
                    maxLength={50}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{errors.name && <span className="text-destructive">{errors.name}</span>}</span>
                    <span>{name.length}/50</span>
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Bio / Description *
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell your audience about yourself, your content, and what they can expect..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={`glass min-h-[120px] ${errors.bio ? 'border-destructive' : ''}`}
                    maxLength={200}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{errors.bio && <span className="text-destructive">{errors.bio}</span>}</span>
                    <span>{bio.length}/200</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-card border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Important Information</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Your creator identity will be stored on the blockchain</li>
                        <li>• This information will be publicly visible to all users</li>
                        <li>• You can update your bio later, but your name will be permanent</li>
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
                  disabled={isLoading || !name.trim() || !bio.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Identity...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Identity
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-8 text-center"
        >
          <Card className="glass-card border-accent/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <p className="text-sm text-muted-foreground">
                After creating your identity, you'll be able to create your first creator token and start sharing exclusive content with your community.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}