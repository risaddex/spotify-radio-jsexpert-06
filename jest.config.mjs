
/** @type {import('@jest/types').Config.InitialOptions} */
const defaultConfig= {
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  preset: "ts-jest/presets/js-with-ts-esm",
  maxWorkers: "50%",
  watchPathIgnorePatterns: ["node_modules"],
  transformIgnorePatterns: ["node_modules"],
  extensionsToTreatAsEsm: [".ts"],
  globals:{
    "ts-jest":{
      useESM:true
    }
  },
 
  
}


const backendConfig = {
  ...defaultConfig,
  testEnvironment: "node",
  displayName: "backend",
  collectCoverageFrom: [
    "server/",
    "!server/index.ts"
  ],
  transformIgnorePatterns: [
    ...defaultConfig.transformIgnorePatterns,
    "public"
  ],
  testMatch: [
    "**/tests/**/server/**/*.test.ts"
  ],
}

/** @type {import('@jest/types').Config.InitialProjectOptions} */
const frontendConfig = {
  ...defaultConfig,
  testEnvironment: "jsdom",
  displayName: "frontend",
  collectCoverageFrom: [
    "public/"
  ],
  transformIgnorePatterns: [
    ...defaultConfig.transformIgnorePatterns,
    "server"
  ],
  testMatch: [
    "**/tests/**/public/**/*.test.ts"
  ],
}

/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  projects: [backendConfig,frontendConfig]
}