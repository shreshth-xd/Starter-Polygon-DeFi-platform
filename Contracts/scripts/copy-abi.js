const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "../artifacts/contracts/CredAura.sol/CredAura.json"
);
if (!fs.existsSync(artifactPath)) {
  console.error("Run `npx hardhat compile` first.");
  process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abiJson = JSON.stringify(artifact.abi, null, 2);

const outRoot = path.join(__dirname, "../abi/CredAura.json");
fs.mkdirSync(path.dirname(outRoot), { recursive: true });
fs.writeFileSync(outRoot, abiJson);

const backendAbi = path.join(
  __dirname,
  "../../Backend/contracts/abi/CredAura.json"
);
fs.mkdirSync(path.dirname(backendAbi), { recursive: true });
fs.writeFileSync(backendAbi, abiJson);

console.log("Wrote ABI to Contracts/abi/CredAura.json and Backend/contracts/abi/CredAura.json");
