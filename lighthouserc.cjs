module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/", "http://localhost:3000/leaderboard"],
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready in",
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
