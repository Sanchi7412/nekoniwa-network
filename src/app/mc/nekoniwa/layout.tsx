import { type FC } from "react";

type RootLayoutProps = {
  children: React.ReactNode;
};

export const metadata = {
  title: "Nekoniwa Network - Minecraft",
  description: "マインクラフトサーバー「ねこにわ」",
};

const RootLayout: FC<RootLayoutProps> = (props) => {
  return <>{props.children}</>;
};

export default RootLayout;
