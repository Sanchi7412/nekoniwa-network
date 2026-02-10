import { NextResponse } from "next/server";

import { getZabbixHostStatus } from "@/lib/zabbix";
import { ZABBIX_CONFIG } from "@/lib/zabbix-config";

export async function GET() {
  try {
    const hosts = await getZabbixHostStatus();

    // Filter out hidden hosts
    const visibleHosts = hosts.filter((host: any) => {
      return !ZABBIX_CONFIG.hosts.hiddenHosts.some(
        (hidden) =>
          host.name.toLowerCase().includes(hidden.toLowerCase()) ||
          host.hostid === hidden,
      );
    });

    // Simplified data for frontend
    const data = visibleHosts.map((host: any) => ({
      id: host.hostid,
      name: host.name,
      status: host.status === "0" ? "online" : "offline", // Zabbix status: 0 is monitored (online-ish), 1 is unmonitored
      uptime:
        host.items && host.items.length > 0
          ? parseInt(host.items[0].lastvalue, 10)
          : 0,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "サーバー状態の取得に失敗しました" },
      { status: 500 },
    );
  }
}
