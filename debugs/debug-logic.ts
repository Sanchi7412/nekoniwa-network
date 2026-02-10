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
  // The previous debug output showed items like "bits received [net.if.in[ifHCInOctets.1]]"
  // My previous route.ts searched for "net.if", "ifInOctets" etc in separate calls.
  // The items returned in debug-ix2215_full.txt (Step 462) clearly show:
  // key_: "net.if.in[ifHCInOctets.1]"
  // This contains "net.if" AND "InOctets" (case insensitive parts?)
  // But route.ts searches for "net.if" (partial match) - this SHOULD find it.

  // Let's verify searching for "net.if" finds these.
  const items = await zabbixRequest("item.get", {
    output: ["itemid", "name", "key_", "value_type"],
    hostids: host.hostid,
    search: { key_: "net.if" },
    sortfield: "name",
  });

  console.log(`Search "net.if" found ${items.length} items.`);

  // Check if we can extract interfaces
  // Logic in route.ts:
  // const match = key.match(/\[(.*?)\]/);
  // key: net.if.in[ifHCInOctets.1]
  // match[1] = ifHCInOctets.1
  // This is NOT "eth0" or "GigaEthernet0".

  // The name is "Interface GigaEthernet0(): Bits received"
  // Logic should probably prefer Name parsing if Key parsing returns technical IDs?
  // Or just group by that ID?

  items.slice(0, 5).forEach((i: any) => {
    const match = i.key_.match(/\[(.*?)\]/);
    const ifId = match ? match[1] : "unknown";
    console.log(`Key: ${i.key_} -> ID: ${ifId}`);
  });

  // If ID is "ifHCInOctets.1" and "ifHCInOctets.2", they are unique interfaces.
  // But we want to group "in" and "out".
  // net.if.in[ifHCInOctets.1] vs net.if.out[ifHCOutOctets.1]
  // The ID "ifHCInOctets.1" and "ifHCOutOctets.1" are DIFFERENT strings.
  // So my grouping logic `interfaces[ifId]` FAILS because IDs don't match!

  // Fix: Extract the numeric index? "1" from "ifHCInOctets.1"?
  // Or parse the NAME? "Interface GigaEthernet0(): ..."
}

main();
