export function explorerBase(chainId?: number) {
  if (chainId === 84532) return "https://sepolia.basescan.org";
  if (chainId === 8453) return "https://basescan.org";
  return null;
}

export function txUrl(chainId: number | undefined, hash?: string) {
  const base = explorerBase(chainId);
  if (!base || !hash) return null;
  return `${base}/tx/${hash}`;
}

export function addrUrl(chainId: number | undefined, addr?: string) {
  const base = explorerBase(chainId);
  if (!base || !addr) return null;
  return `${base}/address/${addr}`;
}
