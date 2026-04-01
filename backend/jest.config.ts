
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],

  // Runs before tests start
  globalSetup: "./tests/globalSetup.ts",

  // Runs after all tests finish
  globalTeardown: "./tests/globalTeardown.ts",

  // Runs before each test file
  setupFilesAfterEnv: ["./tests/setup.ts"],
};

export default config;