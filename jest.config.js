module.exports = {
    preset: 'jest-expo',
    globalSetup: '<rootDir>/test/globalSetup.js',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
};
