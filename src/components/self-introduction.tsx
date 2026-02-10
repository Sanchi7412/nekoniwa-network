"use client";

import { Github, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { EmojiBurst } from "@/components/emoji-burst";
import { useSoundContext } from "@/contexts/sound-context";

export function SelfIntroduction() {
  const { playRandomSound } = useSoundContext();
  const { burst, ParticleRenderer } = EmojiBurst();
  const avatarRef = useRef<HTMLDivElement>(null);

  const handleAvatarClick = () => {
    const result = playRandomSound();

    const el = avatarRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (result) {
        // Sound played — emoji based on sound index
        const emoji = result.soundIndex === 4 ? "🐶" : "🐱";
        burst(emoji, centerX, centerY);
      } else {
        // Sound off — still show cat emoji burst
        burst("🐱", centerX, centerY);
      }
    }
  };

  return (
    <>
      <ParticleRenderer />
      <section className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-xl shadow-lg border border-zinc-700/50">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-700/50">
          <User className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-zinc-100">Profile</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div
            ref={avatarRef}
            className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-4xl overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all active:scale-95"
            onClick={handleAvatarClick}
          >
            <Image
              src="/images/yamanekosanchi.jpg"
              alt="Avatar"
              width={96}
              height={96}
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-zinc-50">やまねこさんち</h2>
            <p className="text-zinc-400 mt-2">
              Nekoniwa Networkの管理人です。
              <br />
              自宅サーバやってたりクラウドやってたりコード書いてたり...
              <br />
              いろんなことやってます。
              <br />
              <br />
              趣味: スキー, ツーリング, ドライブ, 温泉巡り,
              ゲーム(MMOやらFPSやら),VMをぶっ壊すこと
            </p>
            <div className="flex gap-4 mt-4 justify-center md:justify-start">
              <Link
                href="https://github.com/Sanchi7412"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://qiita.com/Sanchi7412"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Image
                  src="/images/qiita-white-icon.png"
                  alt="Qiita"
                  width={24}
                  height={24}
                />
                <span className="sr-only">Qiita</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
