import type { Metadata } from "next";
import { nunitoSans, anonymousPro } from "./fonts";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "California Lobbying Expenditures",
  description:
    "Visualization of state legislation lobbying expenditures in California for the 2025-2026 legislative session",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
      <body className={nunitoSans.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
