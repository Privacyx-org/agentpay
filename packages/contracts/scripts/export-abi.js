const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "..", "sdk", "src", "abi");

const contracts = [
  { name: "TaskEscrow", artifact: "contracts/TaskEscrow.sol/TaskEscrow.json" },
  { name: "AgentRegistry", artifact: "contracts/AgentRegistry.sol/AgentRegistry.json" },
  { name: "MockUSDC", artifact: "contracts/MockUSDC.sol/MockUSDC.json" },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const c of contracts) {
    const artifactPath = path.join(__dirname, "..", "artifacts", c.artifact);
    const raw = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const out = {
      abi: raw.abi,
    };
    const outPath = path.join(OUT_DIR, `${c.name}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log("Wrote", outPath);
  }
}

main();
