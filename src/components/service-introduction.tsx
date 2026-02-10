"use client";

import { ExternalLink, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

type Service = {
  id: string;
  tag: string;
  name: string;
  description: string;
  url: string;
};

const services: Service[] = [
  {
    id: "fuwapachi",
    tag: "Web App",
    name: "ふわぱち",
    description:
      "ふわぱちは、あなたの心の中にある気持ちや考えを、シャボン玉に乗せて空に放つWebアプリです。\n日々のモヤモヤをふわふわと浮かべる。\nただそれだけ。",
    url: "https://fuwapachi.nekoniwa-network.net",
  },
];

export function ServiceIntroduction() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-zinc-700/50">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-700/50">
        <LayoutGrid className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-zinc-100">Services</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-4 rounded-lg border border-zinc-700/50 bg-zinc-800/50 flex items-center justify-between transition-all hover:shadow-md hover:translate-y-[-2px] cursor-pointer group"
            onClick={() => {
              setSelectedService(service);
            }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-400">
                  {service.tag.substring(0, 1)}
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-sm text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
                  {service.name}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  {service.tag}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedService}
        onClose={() => {
          setSelectedService(null);
        }}
        title={selectedService?.name || "Service Details"}
      >
        {selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="bg-zinc-800 px-2 py-1 rounded">
                {selectedService.tag}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-200">概要</h3>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                {selectedService.description}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <Link
                href={selectedService.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
              >
                サービスを見る
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
