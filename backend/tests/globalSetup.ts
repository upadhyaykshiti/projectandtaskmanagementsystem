// Runs once before all tests start.


import { execSync } from "child_process";

export default async () => {
  // Reset test DB before tests
  execSync("npm run test:reset", { stdio: "inherit" });
};