const { ethers } = require("ethers");

const RPC = process.env.BASE_SEPOLIA_RPC_URL;
const USDC = process.env.USDC_ADDRESS;
const PK = process.env.PRIVATE_KEY;
const TO = process.env.TO;
const AMOUNT = process.env.AMOUNT || "1000";

const abi = [
  "function mint(address to, uint256 amount) external",
  "function decimals() view returns (uint8)"
];

async function main() {
  if (!RPC || !USDC || !PK || !TO) {
    throw new Error("Missing env: BASE_SEPOLIA_RPC_URL, USDC_ADDRESS, PRIVATE_KEY, TO");
  }
  if (!PK.startsWith("0x") || PK.length !== 66) {
    throw new Error("PRIVATE_KEY must be 0x + 64 hex chars");
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const c = new ethers.Contract(USDC, abi, wallet);

  const dec = await c.decimals();
  const amount = ethers.parseUnits(AMOUNT, dec);

  const tx = await c.mint(TO, amount);
  console.log("mint tx:", tx.hash);
  await tx.wait();
  console.log(`✅ minted ${AMOUNT} mUSDC to ${TO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
