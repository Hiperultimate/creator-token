import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Compass, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform">
            <span className="text-primary-foreground font-bold text-sm">CT</span>
          </div>
          <span className="text-xl font-bold text-primary">
            CreatorToken
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/discover">
            <Button
              variant={isActive('/discover') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Compass className="h-4 w-4" />
              Discover
            </Button>
          </Link>

          {isAuthenticated && (
            <Link to="/home">
              <Button
                variant={isActive('/home') ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}

          {isAuthenticated && user?.isCreator && user.creatorId && (
            <Link to={`/creator/${user.creatorId}`}>
              <Button
                variant={isActive(`/creator/${user.creatorId}`) ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <User className="h-4 w-4" />
                My Profile
              </Button>
            </Link>
          )}

          {isAuthenticated && !user?.isCreator && (
            <Link to="/creator/create_identity">
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Become Creator
              </Button>
            </Link>
          )}
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          <WalletConnectButton />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-4 pb-3 border-t border-border">
        <div className="flex justify-around items-center space-x-2">
          <Link to="/discover" className="flex-1">
            <Button
              variant={isActive('/discover') ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full gap-1 text-xs"
            >
              <Compass className="h-4 w-4" />
              Discover
            </Button>
          </Link>

          {isAuthenticated && (
            <Link to="/home" className="flex-1">
              <Button
                variant={isActive('/home') ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full gap-1 text-xs"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}

          {isAuthenticated && user?.isCreator && user.creatorId && (
            <Link to={`/creator/${user.creatorId}`} className="flex-1">
              <Button
                variant={isActive(`/creator/${user.creatorId}`) ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full gap-1 text-xs"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
          )}

          {isAuthenticated && !user?.isCreator && (
            <Link to="/creator/create_identity" className="flex-1">
              <Button variant="default" size="sm" className="w-full gap-1 text-xs">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}