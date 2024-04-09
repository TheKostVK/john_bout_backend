// jest.config.cjs
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.cjs'],
    transform: {},
    setupFiles: ['<rootDir>/setupTests.js'], // Путь к файлу настроек для ESM
};
