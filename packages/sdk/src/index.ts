import { ethers } from "ethers";

import TaskEscrowJson from "./abi/TaskEscrow.json";
import AgentRegistryJson from "./abi/AgentRegistry.json";

export type Address = `0x${string}`;

export type AgentPayConfig = {
  chainId: number;
  rpcUrl?: string; // optionnel si tu fournis déjà un provider
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  escrowAddress: Address;
  registryAddress: Address;
  attestorApiUrl?: string; // ex: http://localhost:4444
};

export type AttestationResponse = {
  ok: true;
  attestor: Address;
  resultHash: `0x${string}`;
  validUntil: number;
  signature: `0x${string}`;
};

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

    this.escrow = new ethers.Contract(
      config.escrowAddress,
      (TaskEscrowJson as any).abi,
      escrowRunner
    );

    this.registry = new ethers.Contract(
      config.registryAddress,
      (AgentRegistryJson as any).abi,
      registryRunner
    );
  }

  // ---------- Agent Registry ----------
  async registerAgent(metadataURI: string, payout: Address) {
    this._requireSigner();
    const tx = await this.registry.register(metadataURI, payout);
    return tx.wait();
  }

  async updateAgent(metadataURI: string, payout: Address, active: boolean) {
    this._requireSigner();
    const tx = await this.registry.update(metadataURI, payout, active);
    return tx.wait();
  }

  async getAgent(agent: Address) {
    return this.registry.agents(agent);
  }

  // ---------- Task Escrow ----------
  async createTask(params: {
    agent: Address;
    token: Address;
    amount: bigint;
    deadline: number;
    metadataURI: string;
  }): Promise<bigint> {
    this._requireSigner();

    const tx = await this.escrow.createTask(
      params.agent,
      params.token,
      params.amount,
      params.deadline,
      params.metadataURI
    );

    const rc = await tx.wait();
    const ev = rc.logs
      .map((l: any) => {
        try {
          return this.escrow.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p: any) => p?.name === "TaskCreated");

    if (!ev) throw new Error("TaskCreated event not found");
    return ev.args.taskId as bigint;
  }

  async fundTask(taskId: bigint) {
    this._requireSigner();
    const tx = await this.escrow.fundTask(taskId);
    return tx.wait();
  }

  async release(taskId: bigint) {
    this._requireSigner();
    const tx = await this.escrow.release(taskId);
    return tx.wait();
  }

  async refund(taskId: bigint) {
    this._requireSigner();
    const tx = await this.escrow.refund(taskId);
    return tx.wait();
  }

  async getTask(taskId: bigint) {
    return this.escrow.tasks(taskId);
  }

  // ---------- Attestation ----------
  async requestAttestation(input: {
    taskId: bigint | string;
    client: Address;
    agent: Address;
    result: any;
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
    // any signer can submit; if no signer, we can’t send tx
    this._requireSigner();
    const tx = await this.escrow.releaseWithAttestation(
      params.taskId,
      params.resultHash,
      params.validUntil,
      params.signature
    );
    return tx.wait();
  }

  _requireSigner() {
    if (!this.signer) throw new Error("This method requires a signer");
  }
}
