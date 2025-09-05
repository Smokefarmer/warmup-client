// Address mapping utilities for cross-chain compatibility
// This handles cases where the backend provides addresses for one chain but we need them for another

export interface AddressMapping {
  ethereum?: string;
  solana?: string;
  base?: string;
}

// Known funder address mappings
// TODO: This should eventually be replaced by proper multi-chain support from the backend
export const KNOWN_FUNDER_MAPPINGS: AddressMapping[] = [
  {
    ethereum: '0x485Fd72E0061c88D76fDB1254C8f2DdFb7dE2329',
    solana: '8mGcKUqc6Bzimr9XEci958cwQMybf6GdSXXkZ4amuUTr'
  }
  // Add more mappings as needed
];

/**
 * Find the Solana address for a given Ethereum address
 */
export const findSolanaAddressForEthereum = (ethereumAddress: string): string | null => {
  const mapping = KNOWN_FUNDER_MAPPINGS.find(m => 
    m.ethereum?.toLowerCase() === ethereumAddress.toLowerCase()
  );
  return mapping?.solana || null;
};

/**
 * Find the Ethereum address for a given Solana address
 */
export const findEthereumAddressForSolana = (solanaAddress: string): string | null => {
  const mapping = KNOWN_FUNDER_MAPPINGS.find(m => m.solana === solanaAddress);
  return mapping?.ethereum || null;
};

/**
 * Get the appropriate funder address for a specific chain
 */
export const getFunderAddressForChain = (
  availableAddresses: { ethereum?: string; solana?: string; base?: string },
  targetChain: 'ethereum' | 'solana' | 'base'
): string | null => {
  // First check if we have the address directly
  if (availableAddresses[targetChain]) {
    return availableAddresses[targetChain]!;
  }

  // If we need Solana but only have Ethereum, try to map it
  if (targetChain === 'solana' && availableAddresses.ethereum) {
    return findSolanaAddressForEthereum(availableAddresses.ethereum);
  }

  // If we need Ethereum but only have Solana, try to map it
  if (targetChain === 'ethereum' && availableAddresses.solana) {
    return findEthereumAddressForSolana(availableAddresses.solana);
  }

  return null;
};
