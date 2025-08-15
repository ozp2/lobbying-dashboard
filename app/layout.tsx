import type { Metadata } from "next";
import { nunitoSans, anonymousPro } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "California Lobbyist Spending Dashboard",
  description:
    "Interactive visualization of lobbyist spending by sector with AI-powered categorization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${anonymousPro.variable}`}
    >
      <body className={nunitoSans.className}>{children}</body>
    </html>
  );
}
