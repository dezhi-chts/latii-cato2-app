import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import Script from "next/script";
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
        <Script id="marker-io-snippet" strategy="afterInteractive">
          {`
            window.markerConfig = { project: "69ef488fcd5f30f21d1b58bc", source: "snippet" };
            !function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);
          `}
        </Script>
      </body>
    </html>
  );
}
