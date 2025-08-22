// jest.config.js
export default {
  testEnvironment: "node",
  roots: ["<rootDir>"], // whole BE folder is included
  moduleFileExtensions: ["js", "json"],
  transform: {},

  // match your jsconfig.json
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
};
