import { defineConfig } from "pm2";

export default defineConfig({
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
});
