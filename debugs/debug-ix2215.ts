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
  console.log("Searching for IX2215...");
  const hosts = await zabbixRequest("host.get", {
    output: ["hostid", "name"],
    search: { name: "ix2215" },
  });

  if (!hosts || hosts.length === 0) {
    console.log("IX2215 not found.");
    return;
  }

  const host = hosts[0];
  console.log(`Found: ${host.name} (${host.hostid})`);

  // List all "if" items to see what's available
  console.log(`\nSearching items with key_: "if"...`);
  const items = await zabbixRequest("item.get", {
    output: ["itemid", "name", "key_", "lastvalue", "units"],
    hostids: host.hostid,
    search: { key_: "if" },
    sortfield: "name",
  });
  console.log(`Found ${items ? items.length : 0} items.`);
  if (items && items.length > 0) {
    items.forEach((i: any) => {
      console.log(` - ${i.name} [${i.key_}]: ${i.lastvalue} ${i.units}`);
    });
  }
}

main();
