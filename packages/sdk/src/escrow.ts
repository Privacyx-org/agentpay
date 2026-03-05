import { ethers } from "ethers";

import TaskEscrowJson from "./abi/TaskEscrow.json";
import type {
  Address,
  CreateTaskParams,
  FundTaskParams,
  ReleaseWithAttestationParams,
} from "./types";

export function getEscrowContract(
  escrowAddress: Address,
  runner: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(escrowAddress, (TaskEscrowJson as any).abi, runner);
}

export async function createTask(params: CreateTaskParams): Promise<bigint> {
  const escrow = getEscrowContract(params.escrowAddress, params.signer);

  const tx = await escrow.createTask(
    params.agent,
    params.token,
    params.amount,
    params.deadline,
    params.metadataURI
  );

  const rc = await tx.wait();
  const parsed = rc.logs
    .map((log: any) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((entry: any) => entry?.name === "TaskCreated");

  if (parsed?.args?.taskId != null) return parsed.args.taskId as bigint;

  // Fallback for providers that fail to decode events reliably.
  const nextId: bigint = await escrow.nextTaskId();
  return nextId - 1n;
}

export async function fundTask(params: FundTaskParams) {
  const escrow = getEscrowContract(params.escrowAddress, params.signer);
  const tx = await escrow.fundTask(params.taskId);
  return tx.wait();
}

export async function releaseWithAttestation(params: ReleaseWithAttestationParams) {
  const escrow = getEscrowContract(params.escrowAddress, params.signer);
  const tx = await escrow.releaseWithAttestation(
    params.taskId,
    params.resultHash,
    params.validUntil,
    params.signature
  );
  return tx.wait();
}

export const releaseTask = releaseWithAttestation;
