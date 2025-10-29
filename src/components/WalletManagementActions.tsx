import React, { useState } from 'react';
import { Button } from './common/Button';
import { ConfirmationDialog } from './ConfirmationDialog';
import { WalletCleanupResults } from './WalletCleanupResults';
import { useSellAllTokens, useSendBackToFunder } from '../hooks/useWallets';
import { useFunderStatus, useFunderInfoAll } from '../hooks/useFunding';
import { IWallet } from '../types/wallet';
import { isValidSolanaAddress, convertHexToBase58 } from '../utils/validators';
import { safeToBigInt } from '../utils/formatters';
import { RefreshCw, DollarSign } from 'lucide-react';

interface WalletManagementActionsProps {
  wallet: IWallet;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const WalletManagementActions: React.FC<WalletManagementActionsProps> = ({
  wallet,
  className = '',
  size = 'sm',
  showLabels = true
}) => {
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sellResult, setSellResult] = useState<any>(null);
  const [sendResult, setSendResult] = useState<any>(null);

  const sellAllMutation = useSellAllTokens();
  const sendBackMutation = useSendBackToFunder();
  const { data: funderStatus } = useFunderStatus();
  const { data: funderInfoAll } = useFunderInfoAll();

  const hasBalance = wallet.nativeTokenBalance && safeToBigInt(wallet.nativeTokenBalance) > 0;
  
  // Get funder address for this wallet's chain
  const getFunderAddress = () => {
    const chainId = wallet.chainId.toString();
    
    // First try: Get funder for this wallet's specific chain
    if (funderInfoAll?.funderInfo?.[chainId]?.funderAddress) {
      const funderAddr = funderInfoAll.funderInfo[chainId].funderAddress;
      console.log(`Found funder address for chain ${chainId}:`, funderAddr);
      return funderAddr;
    }
    
    // Fallback: Try funderStatus (might be legacy/default funder)
    if (funderStatus?.funderAddress) {
      console.log('Using funder address from funderStatus:', funderStatus.funderAddress);
      return funderStatus.funderAddress;
    }
    
    console.warn(`No funder address found for chain ${chainId}`);
    return null;
  };
  
  const funderAddress = getFunderAddress();

  const handleSellAllTokens = async () => {
    try {
      const result = await sellAllMutation.mutateAsync(wallet._id);
      setSellResult(result);
      setShowSellConfirm(false);
    } catch (error) {
      console.error('Failed to sell all tokens:', error);
    }
  };

  const handleSendBackToFunder = async () => {
    if (!funderAddress) {
      console.error('No funder address available');
      return;
    }

    // Debug the funder address format
    console.log('Funder address being sent:', funderAddress);
    console.log('Funder address type:', typeof funderAddress);
    console.log('Funder address length:', funderAddress?.length);
    console.log('Is valid Solana address:', isValidSolanaAddress(funderAddress));

    // Validate the funder address format and convert if needed
    let finalFunderAddress = funderAddress;
    if (!isValidSolanaAddress(funderAddress)) {
      console.error('Invalid funder address format:', funderAddress);
      console.error('Address should be in base58 format for Solana');
      
      // Try to convert if it's hex
      const convertedAddress = convertHexToBase58(funderAddress);
      if (convertedAddress) {
        console.log('Converted address from hex to base58:', convertedAddress);
        finalFunderAddress = convertedAddress;
      } else {
        console.error('Could not convert address to base58 format');
        return;
      }
    }

    try {
      console.log('Sending request with funderAddress:', finalFunderAddress);
      console.log('Request body:', {
        walletId: wallet._id,
        funderAddress: finalFunderAddress
      });
      
      const result = await sendBackMutation.mutateAsync({
        walletId: wallet._id,
        funderAddress: finalFunderAddress
      });
      setSendResult(result);
      setShowSendConfirm(false);
    } catch (error) {
      console.error('Failed to send back to funder:', error);
      console.error('Error details:', {
        funderAddress: finalFunderAddress,
        walletId: wallet._id,
        error: error
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>

      
      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="warning"
          size={size}
          onClick={() => setShowSellConfirm(true)}
          disabled={sellAllMutation.isPending || !hasBalance}
          className="flex-1"
        >
          <RefreshCw className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
          {showLabels && 'Sell All'}
        </Button>

        <Button
          variant="primary"
          size={size}
          onClick={() => setShowSendConfirm(true)}
          disabled={sendBackMutation.isPending || !hasBalance || !funderAddress}
          className="flex-1"
        >
          <DollarSign className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
          {showLabels && 'Send to Funder'}
        </Button>
      </div>

      {/* Results Display */}
      {(sellResult || sendResult) && (
        <div className="mt-3">
          <WalletCleanupResults
            sellResult={sellResult}
            sendResult={sendResult}
            walletAddress={wallet.address}
          />
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showSellConfirm}
        onClose={() => setShowSellConfirm(false)}
        onConfirm={handleSellAllTokens}
        title="Sell All Tokens"
        message={`Are you sure you want to sell all tokens in this wallet? This action will convert all token holdings back to SOL and cannot be undone.`}
        confirmText="Sell All Tokens"
        type="warning"
        isLoading={sellAllMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={handleSendBackToFunder}
        title="Send Back to Funder"
        message={`Are you sure you want to send all SOL back to the funder wallet? This action cannot be undone.`}
        confirmText="Send to Funder"
        type="warning"
        isLoading={sendBackMutation.isPending}
      />
    </div>
  );
};
