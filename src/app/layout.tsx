import "@/styles/globals.css";
import { type FC } from "react";
type RootLayoutProps = {
  children: React.ReactNode;
};

export const metadata = {
  title: "Nekoniwa Network",
  description: "工事中...",
};

const RootLayout: FC<RootLayoutProps> = (props) => {
  return (
    <html lang="ja">
      <body className="">{props.children}</body>
    </html>
  );
};

export default RootLayout;
