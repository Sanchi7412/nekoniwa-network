"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type FC,
} from "react";

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  playRandomSound: () => { soundIndex: number } | null;
};

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {
    /* noop */
  },
  playRandomSound: () => null,
});

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const playRandomSound = useCallback(() => {
    if (!soundEnabled) return null;

    // 1-3 は均等確率、4 は低確率 (5%)
    const roll = Math.random();
    let soundIndex: number;
    if (roll < 0.05) {
      soundIndex = 4;
    } else {
      soundIndex = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    }

    const audio = new Audio(`/sounds/sounds_${soundIndex}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // autoplay blocked
    });

    return { soundIndex };
  }, [soundEnabled]);

  return (
    <SoundContext.Provider
      value={{ soundEnabled, toggleSound, playRandomSound }}
    >
      {children}
    </SoundContext.Provider>
  );
};
