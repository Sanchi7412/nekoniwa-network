module.exports = {
  apps: [
    {
      name: "nekoniwa-network",
      script: "pnpm",
      args: "start",
      cwd: "/home/ubuntu/nekoniwa-network", // アプリのディレクトリを指定
      interpreter: "/bin/bash", // 必要ならシェルを指定
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
