module.exports = {
  apps: [
    {
      name: "nekoniwa-network",
      script: "pnpm",
      args: "start",
      cwd: "/home/ubuntu/nekoniwa-network",
      interpreter: "/bin/bash",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
