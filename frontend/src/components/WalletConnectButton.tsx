import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletConnectButtonProps {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'xl';
  className?: string;
}

export function WalletConnectButton({ 
  variant = 'default', 
  size = 'default',
  className 
}: WalletConnectButtonProps) {
  const { connected, disconnect, publicKey } = useWallet();

  if (connected && publicKey) {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={disconnect}
        className={cn("group", className)}
      >
        <LogOut className="mr-2 h-4 w-4 transition-transform" />
        <span className="hidden sm:inline">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
        <span className="sm:hidden">Disconnect</span>
      </Button>
    );
  }

  return (
    <div className={cn("wallet-adapter-button-trigger", className)}>
      <WalletMultiButton
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          height: 'auto',
          fontFamily: 'inherit',
        }}
      >
        <Button variant="default" size={size} className="w-full">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </WalletMultiButton>
    </div>
  );
}