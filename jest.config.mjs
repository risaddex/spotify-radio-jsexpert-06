
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
  maxWorkers: "50%",
  watchPathIgnorePatterns: ["node_modules"],
  transformIgnorePatterns: ["node_modules"],
  globals:{
    "ts-jest":{
      useESM:true
    }
  },
  extensionsToTreatAsEsm: [".ts"]
  
}

/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  preset: "ts-jest",
  projects: [{
    ...defaultConfig,
    transform:{},
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
  }]
}