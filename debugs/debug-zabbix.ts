import { readFileSync } from "fs";
import { resolve } from "path";

// Manually load env vars
let ZABBIX_URL = "http://100.87.109.125/api_jsonrpc.php"; // Hardcoded from previous context or process.env
let ZABBIX_TOKEN = "";

try {
  const envPath = resolve(".env.local");
  console.log(`Loading env from ${envPath}`);
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
  console.error("Could not load .env.local (ignoring if not present)", e);
}

// Fallback to process.env if set
if (!ZABBIX_URL) ZABBIX_URL = process.env.ZABBIX_URL || "";
if (!ZABBIX_TOKEN) ZABBIX_TOKEN = process.env.ZABBIX_TOKEN || "";

if (!ZABBIX_URL || !ZABBIX_TOKEN) {
  console.error("Zabbix credentials missing!");
}

type ZabbixRequest = {
  jsonrpc: "2.0";
  method: string;
  params: any;
  id: number;
  auth: string | null;
};

async function zabbixRequest(method: string, params: any = {}) {
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
    });

    if (!response.ok) {
      throw new Error(`Zabbix API HTTP error: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.error) {
      console.error("Zabbix API Error:", data.error);
      throw new Error(`Zabbix API error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    console.error("Failed to fetch from Zabbix:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Fetching hosts...");
    const hosts = await zabbixRequest("host.get", {
      output: ["hostid", "host", "name"],
      filter: { status: "0" },
    });

    for (const host of hosts) {
      // Only examine IX2215
      if (!host.name.toLowerCase().includes("ix2215")) continue;

      console.log(`\nAnalyzing host: ${host.name} (${host.hostid})`);

      // Dump traffic keys
      console.log("Checking traffic items...");
      const items = await zabbixRequest("item.get", {
        output: ["key_", "name", "lastvalue", "units", "value_type"],
        hostids: host.hostid,
        search: {
          key_: "if",
        },
        searchByAny: true,
      });

      items.forEach((item: any) => {
        if (item.key_.includes("In") || item.key_.includes("Out")) {
          console.log(
            ` - Key: ${item.key_}, Name: ${item.name}, Value: ${item.lastvalue}, Type: ${item.value_type}`,
          );
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
