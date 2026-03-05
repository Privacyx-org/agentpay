import { ethers } from "ethers";

export type Address = `0x${string}`;

export type RegisterAgentParams = {
  registryAddress: Address;
  signer: ethers.Signer;
  metadataURI: string;
  payoutAddress: Address;
};

export type CreateTaskParams = {
  escrowAddress: Address;
  signer: ethers.Signer;
  agent: Address;
  token: Address;
  amount: bigint;
  deadline: number;
  metadataURI: string;
};

export type FundTaskParams = {
  escrowAddress: Address;
  signer: ethers.Signer;
  taskId: bigint;
};

export type ReleaseWithAttestationParams = {
  escrowAddress: Address;
  signer: ethers.Signer;
  taskId: bigint;
  resultHash: `0x${string}`;
  validUntil: number;
  signature: `0x${string}`;
};

export type AgentPayConfig = {
  chainId: number;
  rpcUrl?: string;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  escrowAddress: Address;
  registryAddress: Address;
  attestorApiUrl?: string;
};

export type AttestationResponse = {
  ok: true;
  attestor: Address;
  resultHash: `0x${string}`;
  validUntil: number;
  signature: `0x${string}`;
};
