import "@/styles/globals.css";
import { Delicious_Handrawn, Yusei_Magic } from "next/font/google";
import { type FC } from "react";

import { SoundProvider } from "@/contexts/sound-context";

const deliciousHandrawn = Delicious_Handrawn({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-title-var",
  display: "swap",
});

const yuseiMagic = Yusei_Magic({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-main-var",
  display: "swap",
});

type RootLayoutProps = {
  children: React.ReactNode;
};

export const metadata = {
  title: "Nekoniwa Network",
  description: "工事中...",
};

const RootLayout: FC<RootLayoutProps> = (props) => {
  return (
    <html
      lang="ja"
      className={`${deliciousHandrawn.variable} ${yuseiMagic.variable}`}
    >
      <body
        className="bg-zinc-950 text-zinc-50 font-main"
        suppressHydrationWarning
      >
        <SoundProvider>{props.children}</SoundProvider>
      </body>
    </html>
  );
};

export default RootLayout;
