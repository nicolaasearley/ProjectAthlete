module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo(nent)?|@expo-google-fonts|@unimodules|unimodules|sentry-expo|@sentry/.*|native-base|react-native-svg)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
