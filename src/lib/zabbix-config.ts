export const ZABBIX_CONFIG = {
  hosts: {
    // 部分一致で非表示にするホスト名 (またはID)
    hiddenHosts: ["Template", "Zabbix server", "speedtest"],
  },
  network: {
    // 部分一致で非表示にするインターフェース名
    hiddenInterfaces: [
      "lo",
      "tunnel",
      "null",
      "USB0",
      "GigaEthernet2",
      "Tunnel0.0",
      "GigaEthernet0.0",
      "GigaEthernet0.1",
      "GigaEthernet1.0",
      "GigaEthernet1",
    ],
    // インターフェース名の置換設定 (完全一致 -> 表示名)
    interfaceNames: {
      GigaEthernet0: "メイン回線(ぷらら光)",
    } as Record<string, string>,
  },
  proxmox: {
    // 部分一致で非表示にするVM/CT名 または ID
    hiddenVms: [
      // 例: "template", "test-vm"
      "301",
      "102",
      "104",
    ] as string[],
  },
};
