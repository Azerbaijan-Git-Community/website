module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/"],
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready in",
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
