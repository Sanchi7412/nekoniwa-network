import { readFileSync } from "fs";
import { resolve } from "path";

// Load Env
let ZABBIX_URL = "http://100.87.109.125/api_jsonrpc.php";
let ZABBIX_TOKEN = "";

try {
  const envPath = resolve(".env.local");
  const envConfig = readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value.length > 0) {
      const val = value
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key.trim() === "ZABBIX_URL") ZABBIX_URL = val;
      if (key.trim() === "ZABBIX_TOKEN") ZABBIX_TOKEN = val;
    }
  });
} catch (e) {
  console.error(e);
}

async function zabbixRequest(method: string, params: any = {}) {
  const payload = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
    auth: ZABBIX_TOKEN,
  };
  try {
    const response = await fetch(ZABBIX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json-rpc" },
      body: JSON.stringify(payload),
    });
    const data: any = await response.json();
    return data.result;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

async function main() {
  console.log("Mocking route logic for IX2215...");
  const hosts = await zabbixRequest("host.get", {
    output: ["hostid", "name"],
    search: { name: "ix2215" },
  });

  if (!hosts || hosts.length === 0) return;
  const host = hosts[0];
  console.log(`Using host: ${host.name}`);

  // Fetch items like route.ts
  const agentItems = await zabbixRequest("item.get", {
    output: ["itemid", "name", "key_", "value_type"],
    hostids: host.hostid,
    search: { key_: "net.if" },
  });
  const snmpItemsIn = await zabbixRequest("item.get", {
    output: ["itemid", "name", "key_", "value_type"],
    hostids: host.hostid,
    search: { key_: "ifInOctets" },
  });
  const snmpItemsOut = await zabbixRequest("item.get", {
    output: ["itemid", "name", "key_", "value_type"],
    hostids: host.hostid,
    search: { key_: "ifOutOctets" },
  });

  const items = [
    ...(agentItems || []),
    ...(snmpItemsIn || []),
    ...(snmpItemsOut || []),
  ];
  console.log(`Fetched ${items.length} total items.`);

  // --- COPIED LOGIC START ---
  const interfaces: Record<string, { in?: any; out?: any; name?: string }> = {};

  items.forEach((i: any) => {
    const key = i.key_;
    const name = i.name;

    if (
      !key.includes("in") &&
      !key.includes("In") &&
      !key.includes("out") &&
      !key.includes("Out")
    )
      return;

    const mode = key.toLowerCase().includes("in") ? "in" : "out";

    let ifId = "unknown";
    const nameMatch = name.match(/Interface\s(.*?):/);
    if (nameMatch) {
      ifId = nameMatch[1];
    } else {
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

  const targetIfs = Object.entries(interfaces)
    .filter(([_, v]) => v.in && v.out)
    .filter(
      ([ifId, _]) =>
        !ifId.includes("lo") &&
        !ifId.includes("Loopback") &&
        !ifId.includes("Null"),
    )
    .slice(0, 5);
  // --- COPIED LOGIC END ---

  console.log(`Matched ${targetIfs.length} interfaces with both IN/OUT:`);
  targetIfs.forEach(([name, v]) => {
    console.log(` - ${name}: IN=${v.in?.itemid} OUT=${v.out?.itemid}`);
  });
}

main();
