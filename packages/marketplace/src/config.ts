import { baseSepoliaConfig } from "./config.baseSepolia";
import { localConfig } from "./config.local";

type AppConfig = {
  chainId: number;
  rpcUrl: string;
  escrow: string;
  registry: string;
  usdc: string;
  attestorApiUrl: string;
};

const network = (import.meta.env.VITE_NETWORK || "local").toLowerCase();
const selected = network === "testnet" ? baseSepoliaConfig : localConfig;

function pick(name: string, fallback: string) {
  const value = import.meta.env[name];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const CONFIG: AppConfig = {
  chainId: Number(pick("VITE_CHAIN_ID", String(selected.chainId))),
  rpcUrl: pick("VITE_RPC_URL", selected.rpcUrl),
  escrow: pick("VITE_ESCROW_ADDRESS", selected.escrow),
  registry: pick("VITE_REGISTRY_ADDRESS", selected.registry),
  usdc: pick("VITE_USDC_ADDRESS", selected.usdc),
  attestorApiUrl: pick("VITE_ATTESTOR_API_URL", selected.attestorApiUrl),
};
