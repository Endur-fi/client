import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import React from "react";
import Script from "next/script";

import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import Navbar from "@/components/navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bitcoin Liquid Staking | Bitcoin Staking on Starknet | Endur",
  description:
    "Earn BTC yield with Bitcoin liquid staking on Starknet. Stake Bitcoin, stay liquid, and access BTC LSTs through Endur’s secure staking protocol.",
  keywords: [
    "liquid staking starknet",
    "liquid staking",
    "liquid stake starknet",
    "starknet LST",
    "STRK staking",
    "Endur xSTRK",
    "Endur xyBTC",
    "Endur xWBTC",
    "Endur xtBTC",
    "Endur xLBTC",
    "Endur xsBTC",
    "Wrapped Bitcoin staking",
    "Lombard staking",
    "SolvBTC staking",
    "starknet liquid staking solution",
  ],
  robots: "index,follow",
  openGraph: {
    title: "Bitcoin Liquid Staking | Bitcoin Staking on Starknet | Endur",
    description:
      "Earn BTC yield with Bitcoin liquid staking on Starknet. Stake Bitcoin, stay liquid, and access BTC LSTs through Endur’s secure staking protocol.",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        secureUrl: "https://app.endur.fi/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starknet Liquid Staking (xSTRK & xyBTCs) | Endur.fi",
    description:
      "Stake STRK & BTC with Endur and receive xSTRK & xyBTCs - the liquid staking tokens on Starknet. Earn rewards while accessing DeFi with instant liquidity, higher rewards and faster unstaking",
    site: "@endurfi",
    creator: "@endurfi",
    images: [
      {
        url: "https://app.endur.fi/og.png",
        alt: "Cover Image of endur.fi",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en">
      <body className="bg-[#E8F7F4]">
        {gtmId && (
          <>
            <Script
              id="google-tag-manager"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                `,
              }}
            />
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
          </>
        )}
        <Analytics />

        <Providers>
          <React.Suspense>
            <div className="relative flex h-full min-h-screen w-full">
              {/* <Image
                src="/subtle_tree_bg.svg"
                alt="subtle_tree_bg"
                fill
                className="-z-10 object-cover"
              /> */}

              <AppSidebar />

              <div className="flex flex-1 flex-col justify-between">
                <MaxWidthWrapper className="flex h-full w-full flex-col items-center px-3 py-3 lg:px-7 lg:py-0">
                  <Navbar />
                  {children}
                </MaxWidthWrapper>

                <div className="lg:hidden">
                  <Footer />
                </div>
              </div>
            </div>
          </React.Suspense>

          <Toaster />

          {/* <script
            dangerouslySetInnerHTML={{
              __html: `
                  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                  (function(){
                  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                  s1.async=true;
                  s1.src='https://embed.tawk.to/6883847b94ee92192bc845ed/1j10rr1b6';
                  s1.charset='UTF-8';
                  s1.setAttribute('crossorigin','*');
                  s0.parentNode.insertBefore(s1,s0);
                  })();
              `,
            }}
          /> */}
        </Providers>
      </body>
    </html>
  );
}
