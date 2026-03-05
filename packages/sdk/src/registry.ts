import { ethers } from "ethers";

import AgentRegistryJson from "./abi/AgentRegistry.json";
import type { Address, RegisterAgentParams } from "./types";

export function getRegistryContract(
  registryAddress: Address,
  runner: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(registryAddress, (AgentRegistryJson as any).abi, runner);
}

export async function registerAgent(params: RegisterAgentParams) {
  const registry = getRegistryContract(params.registryAddress, params.signer);
  const tx = await registry.register(params.metadataURI, params.payoutAddress);
  return tx.wait();
}
