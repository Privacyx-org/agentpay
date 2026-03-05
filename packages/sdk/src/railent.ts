import { ethers } from "ethers";

import {
  createTask,
  fundTask,
  getEscrowContract,
  releaseTask,
  releaseWithAttestation,
} from "./escrow";
import { getRegistryContract, registerAgent } from "./registry";
import type {
  Address,
  AgentPayConfig,
  AttestationResponse,
  CreateTaskParams,
  FundTaskParams,
  RegisterAgentParams,
  ReleaseWithAttestationParams,
} from "./types";

export class AgentPayClient {
  public readonly config: AgentPayConfig;
  public readonly provider: ethers.Provider;
  public readonly signer?: ethers.Signer;

  public readonly escrow: ethers.Contract;
  public readonly registry: ethers.Contract;

  constructor(config: AgentPayConfig) {
    this.config = config;

    if (config.provider) {
      this.provider = config.provider;
    } else if (config.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
    } else {
      throw new Error("Provide either provider or rpcUrl");
    }

    this.signer = config.signer;

    const escrowRunner = this.signer ?? this.provider;
    const registryRunner = this.signer ?? this.provider;

    this.escrow = getEscrowContract(config.escrowAddress, escrowRunner);
    this.registry = getRegistryContract(config.registryAddress, registryRunner);
  }

  async registerAgent(metadataURI: string, payout: Address) {
    const signer = this.requireSigner();
    return registerAgent({
      registryAddress: this.config.registryAddress,
      signer,
      metadataURI,
      payoutAddress: payout,
    });
  }

  async updateAgent(metadataURI: string, payout: Address, active: boolean) {
    this.requireSigner();
    const tx = await this.registry.update(metadataURI, payout, active);
    return tx.wait();
  }

  async getAgent(agent: Address) {
    return this.registry.agents(agent);
  }

  async createTask(params: Omit<CreateTaskParams, "escrowAddress" | "signer">): Promise<bigint> {
    const signer = this.requireSigner();
    return createTask({
      escrowAddress: this.config.escrowAddress,
      signer,
      ...params,
    });
  }

  async fundTask(taskId: bigint) {
    const signer = this.requireSigner();
    return fundTask({
      escrowAddress: this.config.escrowAddress,
      signer,
      taskId,
    });
  }

  async release(taskId: bigint) {
    this.requireSigner();
    const tx = await this.escrow.release(taskId);
    return tx.wait();
  }

  async refund(taskId: bigint) {
    this.requireSigner();
    const tx = await this.escrow.refund(taskId);
    return tx.wait();
  }

  async getTask(taskId: bigint) {
    return this.escrow.tasks(taskId);
  }

  async requestAttestation(input: {
    taskId: bigint | string;
    client: Address;
    agent: Address;
    result: unknown;
    ttlSeconds?: number;
  }): Promise<AttestationResponse> {
    const url = this.config.attestorApiUrl;
    if (!url) throw new Error("Missing attestorApiUrl in config");

    const res = await fetch(`${url}/attest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chainId: this.config.chainId,
        escrowAddress: this.config.escrowAddress,
        taskId: input.taskId.toString(),
        client: input.client,
        agent: input.agent,
        result: input.result,
        ttlSeconds: input.ttlSeconds ?? 900,
      }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(`Attestation failed: ${JSON.stringify(json)}`);
    return json as AttestationResponse;
  }

  async releaseWithAttestation(params: {
    taskId: bigint;
    resultHash: `0x${string}`;
    validUntil: number;
    signature: `0x${string}`;
  }) {
    const signer = this.requireSigner();
    return releaseWithAttestation({
      escrowAddress: this.config.escrowAddress,
      signer,
      ...params,
    });
  }

  private requireSigner(): ethers.Signer {
    if (!this.signer) throw new Error("This method requires a signer");
    return this.signer;
  }
}

export {
  createTask,
  fundTask,
  registerAgent,
  releaseTask,
  releaseWithAttestation,
};

export type {
  CreateTaskParams,
  FundTaskParams,
  RegisterAgentParams,
  ReleaseWithAttestationParams,
};
