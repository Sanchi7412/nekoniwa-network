"use client";

import { Volume2, VolumeX } from "lucide-react";
import { type FC } from "react";

import { SelfIntroduction } from "@/components/self-introduction";
import { ServerStatus } from "@/components/server-status";
import { ServiceIntroduction } from "@/components/service-introduction";
import { LightRays } from "@/components/ui/light-rays";
import { Meteors } from "@/components/ui/meteors";
import { useSoundContext } from "@/contexts/sound-context";

const Home: FC = () => {
  const { soundEnabled, toggleSound } = useSoundContext();

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-zinc-950">
        <LightRays />
        <Meteors number={20} />
      </div>

      {/* Sound Toggle - Fixed top right */}
      <button
        onClick={toggleSound}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/70 backdrop-blur-md border border-zinc-700/50 hover:bg-zinc-800/80 transition-all shadow-lg"
        title={soundEnabled ? "サウンドをオフにする" : "サウンドをオンにする"}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-zinc-300" />
        ) : (
          <VolumeX className="w-5 h-5 text-zinc-500" />
        )}
      </button>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 relative z-6">
        <header className="text-center py-80">
          <p className="text-2xl lg:text-2xl font-title tracking-tight text-white drop-shadow-lg">
            ~ Playful &amp; Fun ~
          </p>
          <h1 className="text-6xl lg:text-8xl font-title tracking-tight text-white drop-shadow-lg">
            Nekoniwa Network
          </h1>
        </header>
        <ServiceIntroduction />

        <ServerStatus />

        <SelfIntroduction />

        <footer className="pt-12 pb-8 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Nekoniwa Network. All rights
          reserved.
        </footer>
      </div>
    </main>
  );
};

export default Home;
