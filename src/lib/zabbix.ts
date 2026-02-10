const ZABBIX_URL = process.env.ZABBIX_URL;
const ZABBIX_TOKEN = process.env.ZABBIX_TOKEN;

type ZabbixRequest = {
  jsonrpc: "2.0";
  method: string;
  params: any;
  id: number;
  auth: string | null;
};

type ZabbixResponse<T> = {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data: string;
  };
  id: number;
};

export async function zabbixRequest<T>(
  method: string,
  params: any = {},
): Promise<T> {
  if (!ZABBIX_URL || !ZABBIX_TOKEN) {
    throw new Error("Zabbix credentials not configured");
  }

  const payload: ZabbixRequest = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
    auth: ZABBIX_TOKEN,
  };

  try {
    const response = await fetch(ZABBIX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json-rpc",
      },
      body: JSON.stringify(payload),
      cache: "no-store", // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Zabbix API HTTP error: ${response.status}`);
    }

    const data: ZabbixResponse<T> = await response.json();

    if (data.error) {
      console.error("Zabbix API Error:", data.error);
      throw new Error(`Zabbix API error: ${data.error.message}`);
    }

    return data.result as T;
  } catch (error) {
    console.error("Failed to fetch from Zabbix:", error);
    throw error;
  }
}

export async function getZabbixHostStatus() {
  // 1. Get Hosts
  const hosts = await zabbixRequest<any[]>("host.get", {
    output: ["hostid", "host", "status", "name"],
    filter: { status: "0" }, // Only monitored hosts
  });

  if (!hosts || hosts.length === 0) return [];

  const hostIds = hosts.map((h) => h.hostid);

  // 2. Get Uptime Items
  // Search for "uptime" in key to catch various formats (system.uptime, proxmox.node.uptime, etc.)
  const items = await zabbixRequest<any[]>("item.get", {
    output: ["itemid", "hostid", "key_", "lastvalue", "units"],
    hostids: hostIds,
    search: {
      key_: "uptime",
    },
    searchByAny: true,
  });

  // 3. Merge data
  const result = hosts.map((host) => {
    // Find the most appropriate item if multiple exist
    const hostItems = items.filter((i) => i.hostid === host.hostid);

    // Priority:
    // 1. Standard system.uptime
    // 2. SNMP standard system.uptime[sysUpTime.0]
    // 3. Proxmox Node uptime (avoid container/VM uptimes)
    // 4. Any other uptime
    const uptimeItem =
      hostItems.find((i) => i.key_ === "system.uptime") ||
      hostItems.find((i) => i.key_ === "system.uptime[sysUpTime.0]") ||
      hostItems.find((i) => i.key_.includes("proxmox.node.uptime")) ||
      hostItems.find((i) => i.key_.toLowerCase().includes("uptime")) ||
      hostItems[0];

    return {
      ...host,
      items: uptimeItem ? [uptimeItem] : [],
    };
  });

  return result;
}

export async function getZabbixHistory(itemIds: string[], timeFrom?: number) {
  return await zabbixRequest<any[]>("history.get", {
    output: "extend",
    history: 3, // 0: float, 3: integer (unsigned). Traffic is usually unsigned.
    itemids: itemIds,
    sortfield: "clock",
    sortorder: "ASC",
    time_from: timeFrom,
  });
}

export async function getZabbixItems(hostId: string, searchParams: any) {
  return await zabbixRequest<any[]>("item.get", {
    output: ["itemid", "key_", "name", "lastvalue", "units", "value_type"],
    hostids: hostId,
    search: searchParams,
    searchByAny: true,
  });
}
