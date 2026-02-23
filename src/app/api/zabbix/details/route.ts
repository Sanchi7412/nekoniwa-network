import { NextResponse } from "next/server";

import { getZabbixItems, getZabbixHistory } from "@/lib/zabbix";
import { ZABBIX_CONFIG } from "@/lib/zabbix-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get("id");
  const type = searchParams.get("type"); // "proxmox" | "network" | "other"
  const ALLOWED_PERIODS = [900, 3600, 21600, 43200, 86400];
  const rawPeriod = parseInt(searchParams.get("period") || "3600", 10);
  const period = ALLOWED_PERIODS.includes(rawPeriod) ? rawPeriod : 3600;

  if (!hostId) {
    return NextResponse.json({ error: "Host ID required" }, { status: 400 });
  }

  try {
    let details: any = {};

    if (type === "proxmox") {
      // Fetch VM and CT info
      // Search for "uptime" - broad enough to catch proxmox items
      const items = await getZabbixItems(hostId, {
        key_: "uptime",
      });

      // Filter and Parse items
      const vms = items
        .filter(
          (i) =>
            i.key_.includes("proxmox.qemu.uptime") ||
            i.key_.includes("proxmox.lxc.uptime"),
        )
        .map((i) => {
          // Example Name: VM [mgmt/fuwapachi-web (qemu/103)]: Uptime
          const match = i.name.match(/\[(.*?)\s\((.*?)\)\]/);
          let name = i.name;
          let id = "";
          let type = "unknown";

          if (match) {
            name = match[1];
            const idPart = match[2];
            id = idPart.split("/")[1] || idPart;
            type = idPart.includes("lxc") ? "LXC" : "VM";
          }

          const uptime = parseInt(i.lastvalue, 10);
          const status = uptime > 0 ? "running" : "stopped";

          return {
            id: i.itemid,
            vmId: id,
            name: name,
            type: type,
            status: status,
            uptime: uptime,
          };
        })
        .filter((vm: any) => {
          // Filter out hidden VMs using Config
          if (
            ZABBIX_CONFIG.proxmox.hiddenVms.some(
              (hidden) =>
                vm.name.toLowerCase().includes(hidden.toLowerCase()) ||
                vm.vmId.toString() === hidden,
            )
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          const idA = parseInt(a.vmId, 10) || 0;
          const idB = parseInt(b.vmId, 10) || 0;
          return idA - idB;
        });

      details = { vms };
    } else if (type === "network") {
      // Fetch traffic history for the specified period
      const agentItems = await getZabbixItems(hostId, { key_: "net.if" });
      const snmpItemsIn = await getZabbixItems(hostId, { key_: "ifInOctets" });
      const snmpItemsOut = await getZabbixItems(hostId, {
        key_: "ifOutOctets",
      });

      const items = [...agentItems, ...snmpItemsIn, ...snmpItemsOut];

      // Filter for interfaces
      const interfaces: Record<string, { in?: any; out?: any; name?: string }> =
        {};

      items.forEach((i) => {
        const key = i.key_;
        const name = i.name;

        // Check if relevant traffic item
        const isOut =
          key.includes("Out") ||
          key.includes("out") ||
          key.includes("ifOutOctets");
        const isIn =
          key.includes("In") ||
          key.includes("in") ||
          key.includes("ifInOctets");
        if (!isIn && !isOut) return;

        // Determine direction (check Out first to avoid false match from "in" in "ifOutOctets")
        const mode = isOut ? "out" : "in";

        // Extract interface identifier
        // Strategy 1: Parse Item Name
        let ifId = "unknown";
        const nameMatch = name.match(/Interface\s(.*?):/);
        if (nameMatch) {
          ifId = nameMatch[1];
        } else {
          // Strategy 2: Parse Key
          const keyMatch = key.match(/\[(.*?)\]/);
          if (keyMatch) {
            const content = keyMatch[1];
            const snmpMatch = content.match(/\.(\d+)$/);
            if (snmpMatch) {
              ifId = snmpMatch[1];
            } else {
              ifId = content;
            }
          }
        }

        if (!interfaces[ifId]) interfaces[ifId] = {};
        interfaces[ifId][mode] = i;
        interfaces[ifId].name = ifId.replace(/\(\)$/, "");
      });

      // Select interfaces with BOTH in/out metrics
      const targetIfs = Object.entries(interfaces)
        .filter(([_, v]) => v.in && v.out)
        // Filter using Config (Partial Match)
        .filter(
          ([ifId, _]) =>
            !ZABBIX_CONFIG.network.hiddenInterfaces.some((hidden) =>
              ifId.toLowerCase().includes(hidden.toLowerCase()),
            ),
        )
        .slice(0, 5); // Limit to top 5

      if (targetIfs.length > 0) {
        const itemIds = targetIfs.flatMap(([_, v]) => [
          v.in.itemid,
          v.out.itemid,
        ]);
        const timeFrom = Math.floor(Date.now() / 1000) - period;

        const history = await getZabbixHistory(itemIds, timeFrom);

        // Process history into chart series
        const series = targetIfs
          .map(([ifName, v]) => {
            let cleanName = ifName
              .replace(/\(\)$/, "")
              .replace("Interface ", "");

            // Rename logic based on Config
            if (ZABBIX_CONFIG.network.interfaceNames[cleanName]) {
              cleanName = ZABBIX_CONFIG.network.interfaceNames[cleanName];
            } else if (ZABBIX_CONFIG.network.interfaceNames[ifName]) {
              cleanName = ZABBIX_CONFIG.network.interfaceNames[ifName];
            }

            const inHistory = history.filter(
              (h: any) => h.itemid === v.in.itemid,
            );
            const outHistory = history.filter(
              (h: any) => h.itemid === v.out.itemid,
            );

            // Helper to map history points
            const mapPoints = (hist: any[]) =>
              hist.map((h: any) => ({
                time: parseInt(h.clock, 10),
                value: parseInt(h.value, 10),
              }));

            return [
              {
                name: `${cleanName} In`,
                data: mapPoints(inHistory),
              },
              {
                name: `${cleanName} Out`,
                data: mapPoints(outHistory),
              },
            ];
          })
          .flat();

        details = { chartData: series };
      } else {
        details = {
          message: "トラフィックインターフェースが見つかりませんでした",
        };
      }
    } else {
      details = { message: "このホストタイプの詳細情報はありません" };
    }

    return NextResponse.json(details);
  } catch (error: any) {
    console.error("API Error details:", error);
    return NextResponse.json(
      { error: "詳細情報の取得に失敗しました", details: error.message },
      { status: 500 },
    );
  }
}
