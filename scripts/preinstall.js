import fs from "fs";

for (const file of ["package-lock.json", "yarn.lock"]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Removed ${file}`);
  }
}

const agent = process.env.npm_config_user_agent || "";

if (!agent.startsWith("pnpm/")) {
  console.error("❌ Please use pnpm instead of npm/yarn.");
  process.exit(1);
}

console.log("✅ Using pnpm");