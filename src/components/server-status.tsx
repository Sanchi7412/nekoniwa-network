"use client";

import {
  Server,
  Activity,
  RefreshCw,
  Loader2,
  Router,
  Box,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type Host = {
  id: string;
  name: string;
  status: "online" | "offline";
  uptime: number;
};

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "N/A";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}日`);
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);

  return parts.length > 0 ? parts.join(" ") : "1分未満";
}

export function ServerStatus() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Details Modal State
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/zabbix");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setHosts(data);
    } catch (err) {
      setError("サーバー状態の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleHostClick = async (host: Host) => {
    setSelectedHost(host);
    setLoadingDetails(true);
    setDetails(null);

    try {
      // Determine type based on name
      let type = "other";
      const name = host.name.toLowerCase();
      if (name.includes("proxmox")) type = "proxmox";
      else if (name.includes("ix2215") || name.includes("speedtest"))
        type = "network";
      else if (name.includes("x230")) type = "x230"; // Special case for known missing data

      const res = await fetch(`/api/zabbix/details?id=${host.id}&type=${type}`);
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error("Failed to fetch details", error);
      setDetails({ message: "詳細情報の取得に失敗しました" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderDetailsContent = () => {
    if (loadingDetails) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      );
    }

    if (!details)
      return (
        <div className="text-center p-8 text-zinc-500">
          詳細情報はありません。
        </div>
      );

    if (details.error) {
      return (
        <div className="text-center p-8 text-red-500">{details.error}</div>
      );
    }

    if (details.vms) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Box className="w-5 h-5 text-zinc-500" />
            <h3 className="text-lg font-semibold">仮想マシン & コンテナ</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {details.vms.length === 0 ? (
              <div className="col-span-full text-center text-zinc-500">
                条件に一致するVMは見つかりませんでした。
              </div>
            ) : (
              details.vms.map((vm: any) => (
                <div
                  key={vm.id}
                  className="p-3 border border-zinc-700/50 rounded-lg bg-zinc-800/50 flex items-center space-x-3"
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      vm.status === "running"
                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                        : "bg-red-500",
                    )}
                  />
                  <div className="overflow-hidden">
                    <div
                      className="font-medium text-sm truncate"
                      title={vm.name}
                    >
                      {vm.name}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {vm.type} (ID: {vm.vmId})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (details.chartData) {
      const timeMap = new Map<number, any>();
      details.chartData.forEach((series: any) => {
        series.data.forEach((point: any) => {
          if (!timeMap.has(point.time)) {
            timeMap.set(point.time, {
              time: point.time,
              formattedTime: new Date(point.time * 1000)
                .toLocaleTimeString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                .replace(/\//g, "/"), // Ensure format like 2/10 15:00. Locale might give "2/10 15:00" or similar.
            });
          }
          timeMap.get(point.time)[series.name] = point.value;
        });
      });
      const chartData = Array.from(timeMap.values()).sort(
        (a, b) => a.time - b.time,
      );

      const colors = [
        "#8884d8",
        "#82ca9d",
        "#ffc658",
        "#ff7300",
        "#0088fe",
        "#00c49f",
      ];

      return (
        <div className="h-[400px] w-full">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-zinc-500" />
            <h3 className="text-lg font-semibold">
              ネットワークトラフィック (24時間)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f46"
                vertical={false}
              />
              <XAxis
                dataKey="formattedTime"
                tick={{ fontSize: 10, fill: "#71717a" }}
                interval="preserveStartEnd"
                minTickGap={50}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) =>
                  `${(value / 1000 / 1000).toFixed(1)} Mbps`
                }
                width={60}
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900/95 p-3 rounded-lg shadow-xl border border-zinc-700/50 text-xs">
                        <p className="font-bold mb-2 text-zinc-300 border-b border-zinc-700/50 pb-1">
                          {label}
                        </p>
                        {payload.map((entry: any) => (
                          <div
                            key={entry.name}
                            className="flex items-center gap-2 mb-1 min-w-[150px]"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span
                              className="text-zinc-400 truncate max-w-[120px]"
                              title={entry.name}
                            >
                              {entry.name}
                            </span>
                            <span className="font-mono font-medium ml-auto text-zinc-100">
                              {(entry.value / 1000 / 1000).toFixed(2)} Mbps
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {details.chartData.map((series: any, index: number) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={colors[index % colors.length]}
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedHost?.name.toLowerCase().includes("x230")) {
      return (
        <div className="p-8 text-center text-zinc-500">
          <Router className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">VLAN情報は利用できません</p>
          <p className="text-sm">
            現在、このデバイスのVLANまたはインターフェース情報は収集されていません。
          </p>
        </div>
      );
    }

    return (
      <div className="p-8 text-center text-zinc-500">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">
          {details.message || "詳細情報はありません。"}
        </p>
      </div>
    );
  };

  return (
    <section className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-zinc-700/50">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700/50">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
          <Activity className="w-5 h-5 text-green-500" />
          Server Status
        </h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
          title="更新"
        >
          <RefreshCw
            className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error ? (
        <div className="text-red-500 text-sm bg-red-900/20 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && hosts.length === 0
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : hosts.map((host) => (
                <div
                  key={host.id}
                  className="p-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 flex items-center justify-between transition-all hover:shadow-md hover:translate-y-[-2px] cursor-pointer"
                  onClick={() => handleHostClick(host)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${host.status === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"}`}
                    />
                    <div>
                      <div className="font-medium text-sm text-zinc-100">
                        {host.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {host.status === "online"
                          ? `稼働時間: ${formatUptime(host.uptime)}`
                          : "停止中"}
                      </div>
                    </div>
                  </div>
                  <Server className="w-5 h-5 text-zinc-600" />
                </div>
              ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedHost}
        onClose={() => {
          setSelectedHost(null);
        }}
        title={selectedHost?.name || "詳細情報"}
      >
        {renderDetailsContent()}
      </Modal>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-700 rounded" />
          <div className="h-3 w-16 bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}
