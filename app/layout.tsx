import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Couchbase PDF Chat",
  description: "Couchbase PDF Chat App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Suspense>
        <body className={inter.className}>{children}</body>
      </Suspense>
    </html>
  );
}
