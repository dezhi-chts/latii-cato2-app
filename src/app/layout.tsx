import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { NavigationProvider } from "../context/NavigationContext";
import ClientLayout from "./ClientLayout";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Latii - Forum",
  description: "Latii - Forum",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.className}>
      <head>
        <link rel="icon" href="/favicon-v2.ico" />
      </head>
      <body>
        <NavigationProvider>
          <div className="font-nunito">
            <ClientLayout>{children}</ClientLayout>
          </div>
        </NavigationProvider>
      </body>
    </html>
  );
}
